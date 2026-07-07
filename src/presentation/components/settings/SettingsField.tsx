import { useRef, type ReactNode } from "react";
import { FolderOpenIcon } from "../../icons/ActionIcons";

export const settingsInputClassName =
  "h-8 w-full max-w-[8rem] rounded border border-zinc-600 bg-zinc-800 px-2 text-xs tabular-nums text-zinc-100 outline-none transition focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/60";

export function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-700/80 bg-zinc-800/40 p-4">
      <div className="mb-3">
        <h3 className="text-xs font-medium text-zinc-200">{title}</h3>
        {description && <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{description}</p>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <span className="text-xs text-zinc-300">{label}</span>
        {hint && <p className="mt-0.5 text-[11px] text-zinc-500">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsNumberInput({
  value,
  min,
  max,
  step,
  suffix,
  disabled,
  onChange,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={className ?? settingsInputClassName}
      />
      {suffix && <span className="text-[11px] text-zinc-500">{suffix}</span>}
    </div>
  );
}

export function SettingsTextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "h-8 w-full min-w-[12rem] max-w-[20rem] rounded border border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-100 outline-none transition focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50"
      }
    />
  );
}

export function SettingsColorInput({
  value,
  onChange,
  preview,
}: {
  value: string;
  onChange: (hex: string) => void;
  preview?: ReactNode;
}) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      {preview}
      <button
        type="button"
        onClick={() => colorInputRef.current?.click()}
        className="h-8 w-8 shrink-0 cursor-pointer rounded border border-zinc-600 p-0.5 transition hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/60"
        style={{ backgroundColor: value }}
        title="选择颜色"
      />
      <input
        ref={colorInputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <span className="font-mono text-[11px] text-zinc-400">{value}</span>
    </div>
  );
}

export function CheckerboardPreview({
  lightColor,
  darkColor,
  tileSize = 8,
}: {
  lightColor: string;
  darkColor: string;
  tileSize?: number;
}) {
  const size = tileSize * 2;
  return (
    <div
      className="h-8 w-8 shrink-0 rounded border border-zinc-600"
      style={{
        backgroundColor: lightColor,
        backgroundImage: `linear-gradient(45deg, ${darkColor} 25%, transparent 25%, transparent 75%, ${darkColor} 75%, ${darkColor}), linear-gradient(45deg, ${darkColor} 25%, transparent 25%, transparent 75%, ${darkColor} 75%, ${darkColor})`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `0 0, ${tileSize}px ${tileSize}px`,
      }}
      title="棋盘格预览"
    />
  );
}

export function SettingsToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SettingsRow label={label} hint={hint}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/60 ${
          checked ? "bg-blue-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </SettingsRow>
  );
}

export function SettingsPathField({
  path,
  emptyLabel,
  buttonLabel,
  onPick,
}: {
  path: string | null;
  emptyLabel: string;
  buttonLabel: string;
  onPick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {path ? (
        <div className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800/60 px-3 py-2">
          <FolderOpenIcon className="h-4 w-4 shrink-0 text-zinc-500" />
          <p className="min-w-0 truncate font-mono text-[11px] text-zinc-300" title={path}>
            {path}
          </p>
        </div>
      ) : (
        <p className="text-xs text-zinc-400">{emptyLabel}</p>
      )}
      <button
        type="button"
        onClick={onPick}
        className="w-full rounded bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/60"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/** @deprecated Use SettingsRow + children instead */
export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <SettingsRow label={label} hint={hint}>
      {children}
    </SettingsRow>
  );
}
