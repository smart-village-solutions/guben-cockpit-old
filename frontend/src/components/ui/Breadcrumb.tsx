import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav className={cn("max-w-7xl mx-auto px-4 w-full pb-4", className)}>
      <div className="flex items-center gap-2">
        {items.map((item, index) => (
          <div key={item.href} className="flex items-center gap-2">
            {index > 0 && <span className="text-gray-400">/</span>}
            {index === items.length - 1 ? (
              <span className="text-gubenAccent font-medium">{item.label}</span>
            ) : (
              <Link
                to={item.href}
                className="text-gubenAccent hover:underline flex items-center gap-1"
              >
                {index === 0 && <ArrowLeftIcon className="w-4 h-4" />}
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};
