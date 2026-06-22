import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BaseImgTag } from "@/components/ui/BaseImgTag";
import { cn } from "@/lib/utils";

export interface GenericCardProps {
  // Image section
  imageUrl?: string;
  imageAlt?: string;
  customImageElement?: ReactNode;
  
  // Header section
  title: string;
  titleSize?: "text-lg" | "text-xl" | "text-2xl";
  
  // Description section
  description?: string | ReactNode;
  descriptionAsHtml?: boolean;
  descriptionLines?: number;
  
  // Tags/Categories section
  tags?: Array<{ id: string; name: string }>;
  
  // Extra info section (location, date, etc)
  extraInfo?: ReactNode;
  
  // Action button
  buttonLabel?: string;
  buttonOnClick?: (e: React.MouseEvent) => void;
  
  // Card interaction
  onClick?: () => void;
  className?: string;
  
  // Loading state
  isLoading?: boolean;
}

export const GenericCard = ({
  imageUrl,
  imageAlt,
  customImageElement,
  title,
  titleSize = "text-lg",
  description,
  descriptionAsHtml,
  descriptionLines = 3,
  tags,
  extraInfo,
  buttonLabel,
  buttonOnClick,
  onClick,
  className,
  isLoading = false,
}: GenericCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "flex flex-col bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow h-full",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {/* Image Section */}
      {customImageElement ? (
        <div className="w-full h-48 bg-[#808080] overflow-hidden flex shrink-0 items-center justify-center rounded-t-lg">
          {customImageElement}
        </div>
      ) : imageUrl ? (
        <div className="w-full h-48 bg-[#808080] overflow-hidden flex shrink-0 items-center justify-center rounded-t-lg">
          <BaseImgTag
            src={imageUrl}
            alt={imageAlt || title}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ) : null}

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4">
        {/* Tags/Categories */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-block border text-xs text-muted-foreground rounded-full py-1 px-2 line-clamp-1"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className={cn("font-bold text-gubenAccent line-clamp-2 mb-2", titleSize)}>
          {title}
        </h2>

        {/* Description */}
        {description && (
          <div
            className={cn(
              "text-sm text-gray-600 leading-relaxed mb-2",
              `line-clamp-${descriptionLines}`,
            )}
          >
            {descriptionAsHtml ? (
              <div dangerouslySetInnerHTML={{ __html: String(description) }} />
            ) : (
              description
            )}
          </div>
        )}

        {/* Extra Info (pushed to bottom with margin-top auto) */}
        {extraInfo && (
          <div className="mt-auto pt-2 border-t space-y-2 text-sm text-muted-foreground mb-4">
            {extraInfo}
          </div>
        )}

        {/* Action Button */}
        {buttonLabel && (
          <div className="flex justify-center pb-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                buttonOnClick?.(e);
              }}
            >
              {buttonLabel}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
