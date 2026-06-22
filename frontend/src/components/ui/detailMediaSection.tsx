import { ReactNode, useEffect, useState } from "react";
import { ExpandIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BaseImgTag } from "@/components/ui/BaseImgTag";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type DetailMediaImage = {
  src: string;
  alt?: string;
  caption?: string;
};

interface DetailMediaSectionProps {
  heading: ReactNode;
  body: ReactNode;
  images: DetailMediaImage[];
  className?: string;
}

export function DetailMediaSection({
  heading,
  body,
  images,
  className,
}: DetailMediaSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const hasImages = images.length > 0;
  const hasBody = heading !== null || body !== null;
  const hasMultipleImages = images.length > 1;
  const selectedImage = images[selectedIndex];

  useEffect(() => {
    setSelectedIndex((current) => {
      if (images.length === 0) {
        return 0;
      }

      return Math.min(current, images.length - 1);
    });

    if (images.length === 0) {
      setIsFullscreenOpen(false);
    }
  }, [images.length]);

  const showPrevious = () => {
    setSelectedIndex((current) => Math.max(0, current - 1));
  };

  const showNext = () => {
    setSelectedIndex((current) => Math.min(images.length - 1, current + 1));
  };

  return (
    <section
      className={cn(
        "grid gap-8",
        hasImages && hasBody && "lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start",
        className,
      )}
    >
      {hasBody ? (
        <div>
          {heading ? <h2 className="mb-4 text-xl font-bold">{heading}</h2> : null}
          {body}
        </div>
      ) : null}

      {hasImages && selectedImage ? (
        <>
          <ImageViewer
            image={selectedImage}
            currentIndex={selectedIndex}
            total={images.length}
            hasMultipleImages={hasMultipleImages}
            onPrevious={showPrevious}
            onNext={showNext}
            onOpenFullscreen={() => setIsFullscreenOpen(true)}
          />

          <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
            <DialogContent
              className="max-w-6xl border-none bg-black/95 p-4 text-white shadow-none sm:rounded-xl"
              closeClassName="rounded-full bg-black/70 p-2 text-white opacity-100 hover:bg-black/80 hover:opacity-100 focus:ring-white/40 focus:ring-offset-0"
            >
              <DialogTitle className="sr-only">Bildansicht</DialogTitle>
              <DialogDescription className="sr-only">
                Vollbildansicht des aktuell ausgewaehlten Detailbilds
              </DialogDescription>
              <ImageViewer
                image={selectedImage}
                currentIndex={selectedIndex}
                total={images.length}
                hasMultipleImages={hasMultipleImages}
                onPrevious={showPrevious}
                onNext={showNext}
                isFullscreen
              />
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </section>
  );
}

interface ImageViewerProps {
  image: DetailMediaImage;
  currentIndex: number;
  total: number;
  hasMultipleImages: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOpenFullscreen?: () => void;
  isFullscreen?: boolean;
}

function ImageViewer({
  image,
  currentIndex,
  total,
  hasMultipleImages,
  onPrevious,
  onNext,
  onOpenFullscreen,
  isFullscreen = false,
}: ImageViewerProps) {
  return (
    <div className="relative overflow-hidden">
      {onOpenFullscreen ? (
        <button
          type="button"
          aria-label="Bild im Vollbild öffnen"
          onClick={onOpenFullscreen}
          className="group block w-full text-left"
        >
          <BaseImgTag
            src={image.src}
            alt={image.alt ?? ""}
            className={cn(
              "w-full object-contain",
              isFullscreen ? "max-h-[80vh]" : "max-h-[32rem]",
            )}
          />
          <span className="pointer-events-none absolute right-3 top-3 inline-flex rounded-full bg-black/70 p-2 text-white">
            <ExpandIcon className="size-4" />
          </span>
        </button>
      ) : (
        <BaseImgTag
          src={image.src}
          alt={image.alt ?? ""}
          className={cn(
            "w-full object-contain",
            isFullscreen ? "max-h-[80vh]" : "max-h-[32rem]",
          )}
        />
      )}

      {hasMultipleImages ? (
        <>
          <MediaNavButton
            direction="previous"
            onClick={onPrevious}
            disabled={currentIndex === 0}
          />
          <MediaNavButton
            direction="next"
            onClick={onNext}
            disabled={currentIndex === total - 1}
          />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white">
            {currentIndex + 1} / {total}
          </div>
        </>
      ) : null}

      {image.caption ? (
        <div
          className={cn(
            "border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600",
            isFullscreen && "border-neutral-700 text-neutral-200",
          )}
        >
          {image.caption}
        </div>
      ) : null}
    </div>
  );
}

function MediaNavButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "previous" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  const isPrevious = direction === "previous";

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={isPrevious ? "Vorheriges Bild" : "Nächstes Bild"}
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 text-neutral-900 hover:bg-white",
        isPrevious ? "left-3" : "right-3",
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {isPrevious ? <ChevronLeftIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
    </Button>
  );
}
