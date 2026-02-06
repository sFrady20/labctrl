import { useState, ReactNode } from "react";
import clsx from "clsx";

interface CollapsibleProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: ReactNode;
}

export function Collapsible({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col rounded-xl overflow-hidden border border-[#1a1a1a]">
      <button
        className="flex items-center justify-between px-4 h-10 bg-[#0a0a0a] hover:bg-[#111] cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {icon && <div className={clsx(icon, "text-neutral-400")} />}
          <span className="font-medium text-sm">{title}</span>
          {badge}
        </div>
        <div
          className={clsx(
            "i-bx-chevron-down transition-transform text-neutral-500",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && <div className="bg-black">{children}</div>}
    </div>
  );
}
