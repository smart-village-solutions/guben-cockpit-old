import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "./Breadcrumb";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface DetailPageLayoutProps {
  // Hero section
  heroImage?: string;
  heroAlt?: string;
  title: ReactNode;

  // Content
  children: ReactNode;

  // Breadcrumb items (optional - if provided, will be shown instead of back link)
  breadcrumbItems?: BreadcrumbItem[];

  // Back link (optional - used if breadcrumbItems not provided)
  onBack?: () => void;
  backLabel?: string;

  // Optional metadata section
  metadata?: ReactNode;

  // Additional classes
  className?: string;
}

export const DetailPageLayout = ({
  heroImage,
  heroAlt,
  title,
  children,
  breadcrumbItems,
  onBack,
  backLabel = "Zurück",
  metadata,
  className,
}: DetailPageLayoutProps) => {
  const fallbackHeroAlt = typeof title === "string" ? title : "Detailbild";

  return (
    <main className={cn("relative w-full", className)}>
      {/* Breadcrumb Navigation */}
      {breadcrumbItems ? (
        <Breadcrumb items={breadcrumbItems} />
      ) : onBack ? (
        <div className="max-w-7xl mx-auto px-4 w-full pt-4 pb-2">
          <button
            onClick={onBack}
            className="text-gubenAccent hover:underline flex items-center gap-1 text-sm font-medium"
          >
            ← {backLabel}
          </button>
        </div>
      ) : null}

      {/* Content Section */}
      <section className="max-w-7xl mx-auto px-4 w-full space-y-8">
        {/* Title & Metadata Card with Image */}
        {metadata && (
          <div className="rounded-md bg-white space-y-4 shadow-lg overflow-hidden">
            {/* Image at top - no overlay, no darkening */}
            {heroImage && (
              <img
                src={heroImage}
                alt={heroAlt || fallbackHeroAlt}
                className="w-full h-64 object-cover"
              />
            )}

            {/* Content inside card */}
            <div className="p-8 space-y-4">
              <h1 className="font-bold text-3xl">{title}</h1>
              {metadata}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div>
          {!metadata && <h1 className="font-bold text-3xl mb-8">{title}</h1>}
          {children}
        </div>
      </section>
    </main>
  );
};
