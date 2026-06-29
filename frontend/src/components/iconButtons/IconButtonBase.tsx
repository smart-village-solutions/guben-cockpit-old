import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface IconButtonBaseProps {
  disabled?: boolean;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  label?: string;
}

export const IconButtonBase = ({
  disabled,
  icon: Icon,
  onClick,
  className,
  label,
}: IconButtonBaseProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    aria-label={label}
    title={label}
    className={cn("rounded-full p-1.5 border size-8", className)}
  >
    <Icon className="size-full" />
  </button>
);
