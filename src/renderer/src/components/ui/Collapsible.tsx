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
    <div className="flex flex-col b-1 b-gray-900 b-solid rounded-lg overflow-hidden">
      <button
        className="flex items-center justify-between px-4 h-10 bg-gray-900 hover:bg-gray-800 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {icon && <div className={icon} />}
          <span className="font-medium text-sm">{title}</span>
          {badge}
        </div>
        <div
          className={clsx(
            "i-bx-chevron-down transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && <div className="bg-gray-950">{children}</div>}
    </div>
  );
}
