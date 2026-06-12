import { useEffect, useRef, useState } from "react";
import { MenuDropdown, type MenuGroup } from "./MenuDropdown";

interface MenuBarProps {
  menus: MenuGroup[];
}

export function MenuBar({ menus }: MenuBarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setOpenMenuId(null);

  useEffect(() => {
    if (!openMenuId) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  return (
    <div ref={containerRef} className="flex items-center gap-0.5">
      {menus.map((menu) => (
        <MenuDropdown
          key={menu.id}
          label={menu.label}
          open={openMenuId === menu.id}
          onToggle={() => setOpenMenuId((prev) => (prev === menu.id ? null : menu.id))}
          onClose={closeMenu}
          items={menu.items}
        />
      ))}
    </div>
  );
}
