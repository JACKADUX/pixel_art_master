interface WorkspaceRegionBorderProps {
  active: boolean;
}

/**
 * 主区域「激活态」边框：绝对定位的覆盖层，置于内容之上，
 * 不拦截指针事件。使用低饱和浅蓝色内嵌 ring 表示焦点区域。
 *
 * 注意：宿主容器需为 `relative` 定位。
 */
export function WorkspaceRegionBorder({ active }: WorkspaceRegionBorderProps) {
  if (!active) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 ring-1 ring-inset ring-sky-400/60"
    />
  );
}
