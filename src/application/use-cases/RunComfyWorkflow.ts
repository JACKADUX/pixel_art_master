import type { IComfyUiClient } from "@/application/ports/IComfyUiClient";
import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";
import {
  applyParameterOverrides,
  type ComfyParameter,
} from "@/domain/comfyui/ComfyParameter";
import type { ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import type { ComfyProgressEvent } from "@/domain/comfyui/ComfyProgress";
import {
  collectResultImages,
  mergeImageRefs,
  type ComfyImageRef,
} from "@/domain/comfyui/ComfyResult";

export interface ComfyResultImage {
  ref: ComfyImageRef;
  blob: Blob;
}

export type ComfyRunEvent =
  | { kind: "queued"; promptId: string }
  | { kind: "progress"; event: ComfyProgressEvent }
  | {
      kind: "result";
      images: ComfyResultImage[];
      /** 本次实际产出图片的全部节点 id（未经勾选过滤），用于诊断与提示 */
      producedNodeIds: string[];
    }
  | { kind: "error"; message: string };

/**
 * 编排一次工作流执行：回填参数 -> 建立进度流 -> 排队 -> 监听直到完成 -> 收集结果图。
 * 以事件流形式产出，便于上层逐步更新 UI。
 */
export interface RunComfyWorkflowOptions {
  /**
   * 仅收集这些节点产生的结果图。
   * 传入 `undefined` 表示不过滤（保留全部输出）。
   */
  allowedOutputNodeIds?: readonly string[];
}

export async function* runComfyWorkflow(
  client: IComfyUiClient,
  config: ComfyServerConfig,
  workflow: ComfyApiWorkflow,
  parameters: ComfyParameter[],
  clientId: string,
  signal: AbortSignal,
  options: RunComfyWorkflowOptions = {},
): AsyncGenerator<ComfyRunEvent, void, unknown> {
  const prompt = applyParameterOverrides(workflow, parameters);

  // 先等待 WebSocket 进度流连接 OPEN，再排队 prompt，避免错过早期/快速完成的事件。
  const stream = await client.openProgressStream(config, clientId, signal);

  let promptId: string;
  try {
    const queued = await client.queuePrompt(config, prompt, clientId, signal);
    promptId = queued.promptId;
  } catch (error) {
    await stream.return(undefined);
    throw error;
  }

  yield { kind: "queued", promptId };

  let started = false;
  let finished = false;
  // 执行期通过 `executed` 消息下发的图（含未写入 /history 的预览节点）
  const executedRefs: ComfyImageRef[] = [];

  try {
    for await (const event of stream) {
      yield { kind: "progress", event };

      if (event.kind === "error" && (!event.promptId || event.promptId === promptId)) {
        yield { kind: "error", message: event.message };
        return;
      }

      if (event.kind === "executed") {
        executedRefs.push(...event.images);
      }

      if (event.kind === "executionStart" && event.promptId === promptId) {
        started = true;
      }

      if (event.kind === "executing") {
        if (event.node !== null) {
          started = true;
        } else if (started && (event.promptId === promptId || event.promptId === "")) {
          finished = true;
          break;
        }
      }
    }
  } finally {
    await stream.return(undefined);
  }

  if (!finished) {
    // 流提前结束（连接断开或中断）。
    return;
  }

  const history = await client.fetchHistory(config, promptId, signal);
  const historyRefs = collectResultImages(history, promptId);
  // 未过滤的全部产出图（用于诊断：本次到底哪些节点出了图）
  const allRefs = mergeImageRefs([historyRefs, executedRefs]);
  const producedNodeIds = [...new Set(allRefs.map((ref) => ref.nodeId))];
  // 合并 /history 与执行期收集到的图，去重后按所选输出节点过滤
  const refs = mergeImageRefs([historyRefs, executedRefs], options.allowedOutputNodeIds);

  const images: ComfyResultImage[] = [];
  for (const ref of refs) {
    const blob = await client.fetchImageBlob(config, ref, signal);
    images.push({ ref, blob });
  }

  yield { kind: "result", images, producedNodeIds };
}
