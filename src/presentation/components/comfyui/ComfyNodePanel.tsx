import { useMemo, useState } from "react";
import type { ComfyParameter } from "@/domain/comfyui/ComfyParameter";
import {
  collectWorkflowClassTypes,
  isExportableClassType,
  listWorkflowNodes,
} from "@/domain/comfyui/ComfyOutputNode";
import { componentTypeLabel } from "@/domain/comfyApp/ComfyAppComponent";
import { useComfyUiStore } from "@/presentation/stores/comfyUiStore";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";
import { ParameterSettingsPopover } from "./ParameterSettingsPopover";

function ParameterInput({
  parameter,
  disabled,
  onChange,
}: {
  parameter: ComfyParameter;
  disabled: boolean;
  onChange: (value: string | number | boolean) => void;
}) {
  if (parameter.type === "boolean") {
    return (
      <input
        type="checkbox"
        checked={Boolean(parameter.value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5"
      />
    );
  }

  if (parameter.type === "number") {
    return (
      <input
        type="number"
        value={Number(parameter.value)}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === "" ? 0 : Number(next));
        }}
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none transition focus:border-blue-500 disabled:opacity-50"
      />
    );
  }

  const isLong =
    parameter.inputKey.toLowerCase().includes("text") || String(parameter.value).length > 40;

  return isLong ? (
    <textarea
      value={String(parameter.value)}
      disabled={disabled}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none transition focus:border-blue-500 disabled:opacity-50"
    />
  ) : (
    <input
      type="text"
      value={String(parameter.value)}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none transition focus:border-blue-500 disabled:opacity-50"
    />
  );
}

function ParameterRow({
  parameter,
  disabled,
  onChange,
  onOpenSettings,
}: {
  parameter: ComfyParameter;
  disabled: boolean;
  onChange: (value: string | number | boolean) => void;
  onOpenSettings: () => void;
}) {
  const exposedComponent = useComfyAppStore((s) => s.findComponentByParameter(parameter.id));
  const exposed = Boolean(exposedComponent);

  return (
    <div
      className={`group/row space-y-1 rounded p-1.5 text-xs transition ${
        exposed ? "bg-blue-950/30 ring-1 ring-blue-700/60" : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400">{parameter.inputKey}</span>
        {exposed && exposedComponent && (
          <span className="rounded bg-blue-700/70 px-1 text-[9px] font-medium text-blue-100">
            已提取 · {componentTypeLabel(exposedComponent.type)}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          title="参数提取与组件设置"
          className={`ml-auto flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100 ${
            exposed ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.03 7.03 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.93 6.93 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      </div>
      <ParameterInput parameter={parameter} disabled={disabled} onChange={onChange} />
    </div>
  );
}

export function ComfyNodePanel() {
  const workflow = useComfyUiStore((s) => s.workflow);
  const parameters = useComfyUiStore((s) => s.parameters);
  const outputClassTypes = useComfyUiStore((s) => s.outputClassTypes);
  const selectedOutputNodeIds = useComfyUiStore((s) => s.selectedOutputNodeIds);
  const running = useComfyUiStore((s) => s.running);
  const setParameter = useComfyUiStore((s) => s.setParameter);
  const toggleOutputNode = useComfyUiStore((s) => s.toggleOutputNode);

  const [settingsParameterId, setSettingsParameterId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const nodes = useMemo(() => (workflow ? listWorkflowNodes(workflow) : []), [workflow]);
  const typeOptions = useMemo(
    () => (workflow ? collectWorkflowClassTypes(workflow) : []),
    [workflow],
  );

  const paramsByNode = useMemo(() => {
    const map = new Map<string, ComfyParameter[]>();
    for (const parameter of parameters) {
      const list = map.get(parameter.nodeId);
      if (list) list.push(parameter);
      else map.set(parameter.nodeId, [parameter]);
    }
    return map;
  }, [parameters]);

  const selected = useMemo(() => new Set(selectedOutputNodeIds), [selectedOutputNodeIds]);

  const filteredNodes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return nodes.filter((node) => {
      if (typeFilter && node.classType !== typeFilter) return false;
      if (query) {
        const inTitle = node.nodeTitle.toLowerCase().includes(query);
        const inType = node.classType.toLowerCase().includes(query);
        const inParams = (paramsByNode.get(node.nodeId) ?? []).some((p) =>
          p.inputKey.toLowerCase().includes(query),
        );
        if (!inTitle && !inType && !inParams) return false;
      }
      return true;
    });
  }, [nodes, typeFilter, search, paramsByNode]);

  const settingsParameter = useMemo(
    () => parameters.find((p) => p.id === settingsParameterId) ?? null,
    [parameters, settingsParameterId],
  );

  if (!workflow) {
    return (
      <p className="py-6 text-center text-xs text-zinc-600">
        导入工作流后将在此显示节点与参数
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索节点名 / 参数名"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none transition focus:border-blue-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="max-w-[45%] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300 outline-none transition focus:border-blue-500"
        >
          <option value="">全部类型</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {filteredNodes.length === 0 ? (
        <p className="py-4 text-center text-xs text-zinc-600">没有匹配的节点</p>
      ) : (
        filteredNodes.map((node) => {
          const nodeParams = paramsByNode.get(node.nodeId) ?? [];
          const exportable = isExportableClassType(node.classType, outputClassTypes);
          const checked = selected.has(node.nodeId);
          return (
            <div
              key={node.nodeId}
              className="group/node space-y-2 rounded border border-zinc-800 bg-zinc-900/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-zinc-200">
                    {node.nodeTitle}
                  </div>
                  <div className="text-[10px] text-zinc-600">
                    #{node.nodeId} · {node.classType}
                  </div>
                </div>
                {exportable && (
                  <label
                    title="勾选后该节点的结果图会被导出/显示"
                    className={`flex shrink-0 cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition ${
                      checked
                        ? "bg-emerald-800/50 text-emerald-200 opacity-100"
                        : "text-zinc-400 opacity-0 group-hover/node:opacity-100 hover:bg-zinc-800"
                    } ${running ? "cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={running}
                      onChange={() => toggleOutputNode(node.nodeId)}
                      className="h-3 w-3"
                    />
                    导出图片
                  </label>
                )}
              </div>

              {nodeParams.length > 0 ? (
                <div className="space-y-1.5">
                  {nodeParams.map((parameter) => (
                    <ParameterRow
                      key={parameter.id}
                      parameter={parameter}
                      disabled={running}
                      onChange={(value) => setParameter(parameter.id, value)}
                      onOpenSettings={() => setSettingsParameterId(parameter.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-600">无可编辑参数</p>
              )}
            </div>
          );
        })
      )}

      {settingsParameter && (
        <ParameterSettingsPopover
          parameter={settingsParameter}
          allParameters={parameters}
          onClose={() => setSettingsParameterId(null)}
        />
      )}
    </div>
  );
}
