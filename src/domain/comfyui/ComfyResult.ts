/** ComfyUI 输出图像引用，对应 /view 接口参数；nodeId 标记其来源节点 */
export interface ComfyImageRef {
  filename: string;
  subfolder: string;
  type: string;
  /** 产生该图的节点 id（来自 /history outputs 的键） */
  nodeId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseImageRef(value: unknown, nodeId: string): ComfyImageRef | null {
  if (!isRecord(value)) return null;
  if (typeof value.filename !== "string") return null;
  return {
    filename: value.filename,
    subfolder: typeof value.subfolder === "string" ? value.subfolder : "",
    type: typeof value.type === "string" ? value.type : "output",
    nodeId,
  };
}

/** 从节点输出对象中收集图像引用（含 images / gifs 等数组字段） */
export function collectImagesFromOutput(output: unknown, nodeId: string): ComfyImageRef[] {
  if (!isRecord(output)) return [];
  const refs: ComfyImageRef[] = [];
  for (const value of Object.values(output)) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const ref = parseImageRef(item, nodeId);
      if (ref) refs.push(ref);
    }
  }
  return refs;
}

/**
 * 从 /history 响应中收集指定 prompt 的结果图。
 * 形如 `{ [promptId]: { outputs: { [nodeId]: { images: [...] } } } }`。
 *
 * @param allowedNodeIds 可选白名单：仅保留这些节点产生的图。
 *   传入 `undefined` 表示不过滤（全部保留）；传入数组（含空数组）时严格过滤。
 */
export function collectResultImages(
  history: unknown,
  promptId: string,
  allowedNodeIds?: readonly string[],
): ComfyImageRef[] {
  if (!isRecord(history)) return [];
  const entry = history[promptId];
  if (!isRecord(entry)) return [];
  const outputs = entry.outputs;
  if (!isRecord(outputs)) return [];

  const allow = allowedNodeIds ? new Set(allowedNodeIds) : null;

  const refs: ComfyImageRef[] = [];
  for (const [nodeId, nodeOutput] of Object.entries(outputs)) {
    if (allow && !allow.has(nodeId)) continue;
    refs.push(...collectImagesFromOutput(nodeOutput, nodeId));
  }
  return refs;
}

/** 图像引用的去重键（同一文件视为同一张图） */
export function imageRefKey(ref: ComfyImageRef): string {
  return `${ref.type}|${ref.subfolder}|${ref.filename}`;
}

/**
 * 合并多个来源的结果图（如 /history 与执行期 `executed` 事件），按文件去重，
 * 并可选地按节点白名单过滤。先出现的来源优先保留。
 */
export function mergeImageRefs(
  sources: ReadonlyArray<readonly ComfyImageRef[]>,
  allowedNodeIds?: readonly string[],
): ComfyImageRef[] {
  const allow = allowedNodeIds ? new Set(allowedNodeIds) : null;
  const seen = new Set<string>();
  const out: ComfyImageRef[] = [];
  for (const source of sources) {
    for (const ref of source) {
      if (allow && !allow.has(ref.nodeId)) continue;
      const key = imageRefKey(ref);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(ref);
    }
  }
  return out;
}
