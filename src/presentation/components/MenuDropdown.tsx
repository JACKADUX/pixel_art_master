import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type MenuItem =
  | {
      type: "action";
      label: string;
      icon?: IconComponent;
      shortcut?: string;
      onClick: () => void;
      disabled?: boolean;
    }
  | {
      type: "toggle";
      label: string;
      icon?: IconComponent;
      shortcut?: string;
      checked: boolean;
      onClick: () => void;
    }
  | {
      type: "submenu";
      label: string;
      icon?: IconComponent;
      items: Array<{
        type: "action";
        label: string;
        onClick: () => void;
        disabled?: boolean;
      }>;
    }
  | { type: "separator" };

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

interface MenuDropdownProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: MenuItem[];
}

export function MenuDropdown({ label, open, onToggle, onClose, items }: MenuDropdownProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleItemClick = (onClick: () => void) => {
    onClick();
    onClose();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded px-2.5 py-1 text-xs font-medium transition hover:bg-zinc-700 ${
          open ? "bg-zinc-700 text-zinc-100" : "text-zinc-300"
        }`}
      >
        {label}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-0.5 min-w-[200px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl">
          {items.map((item, index) => {
            if (item.type === "separator") {
              return <div key={`sep-${index}`} className="my-1 border-t border-zinc-700" />;
            }

            if (item.type === "toggle") {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleItemClick(item.onClick)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {item.checked && <CheckIcon className="h-3.5 w-3.5" />}
                  </span>
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-zinc-400" />}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-4 shrink-0 text-zinc-500">{item.shortcut}</span>
                  )}
                </button>
              );
            }

            if (item.type === "submenu") {
              const SubIcon = item.icon;
              const isSubOpen = openSubmenu === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenSubmenu(item.label)}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isSubOpen}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition ${
                      isSubOpen
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    }`}
                  >
                    {SubIcon ? (
                      <SubIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className="flex-1">{item.label}</span>
                    <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                  </button>

                  {isSubOpen && (
                    <div className="absolute left-full top-0 z-50 ml-0.5 max-h-[60vh] min-w-[180px] overflow-y-auto rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl">
                      {item.items.map((subItem) => (
                        <button
                          key={subItem.label}
                          type="button"
                          disabled={subItem.disabled}
                          onClick={() => handleItemClick(subItem.onClick)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <span className="flex-1 truncate">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                onClick={() => handleItemClick(item.onClick)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {Icon ? (
                  <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                ) : (
                  <span className="w-4 shrink-0" />
                )}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-4 shrink-0 text-zinc-500">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
