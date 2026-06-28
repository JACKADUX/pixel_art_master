import { useEffect, useRef, useState } from "react";
import { useAiFieldRegistryStore } from "../../stores/aiFieldRegistryStore";
import { useAiTextFieldSessionStore } from "../../stores/aiTextFieldSessionStore";

interface AiTextFieldProps {
  fieldId: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  rows?: number;
  className?: string;
  placeholder?: string;
}

export function AiTextField({
  fieldId,
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  className = "",
  placeholder = "",
}: AiTextFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(value);

  // 当外部 value 改变（如 AI 填入）时，同步更新 localValue
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const register = useAiFieldRegistryStore((s) => s.register);
  const unregister = useAiFieldRegistryStore((s) => s.unregister);
  const isOpen = useAiTextFieldSessionStore((s) => s.isOpen);
  const activeFieldId = useAiTextFieldSessionStore((s) => s.activeFieldId);
  const openSession = useAiTextFieldSessionStore((s) => s.openSession);

  useEffect(() => {
    register({
      fieldId,
      label,
      getValue: () => localValue,
      setValue: (val) => {
        setLocalValue(val);
        onChange(val);
      },
    });
    return () => {
      unregister(fieldId);
    };
  }, [fieldId, label, localValue, register, unregister, onChange]);

  const activateSession = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    openSession(fieldId, label, rect);
  };

  const handleFocus = () => {
    if (!isOpen) return;
    activateSession();
  };

  const handleAiClick = () => {
    activateSession();
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const inputClassName =
    "w-full rounded border border-zinc-600 bg-zinc-800 pl-2 pr-8 text-xs text-zinc-100 outline-none focus:border-blue-500 transition-colors";
  
  return (
    <div ref={containerRef} className="group relative w-full">
      {multiline ? (
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={rows}
          placeholder={placeholder}
          className={`${inputClassName} py-1.5 leading-relaxed ${className}`}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`${inputClassName} h-8 ${className}`}
        />
      )}
      
      <button
        type="button"
        onClick={handleAiClick}
        title="AI 辅助写作"
        className="absolute right-2 top-1.5 flex h-5 w-5 items-center justify-center rounded bg-zinc-700 text-zinc-300 opacity-0 transition-opacity hover:bg-blue-600 hover:text-white group-hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-3.5 w-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813ZM18.281 9.281 17.5 13l-.781-3.719L13 8.5l3.719-.781L17.5 4l.781 3.719L22 8.5l-3.719.781Z"
          />
        </svg>
      </button>
    </div>
  );
}
