import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import type { InformationCard } from "@shared/public-content/contracts";
import { WithClassName } from "@/types/WithClassName";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GenericCard } from "@/components/ui/GenericCard";
import { Card } from "@/components/ui/card";

interface Props extends WithClassName {
  card: InformationCard;
}

export const InfoCard = ({ card, className }: Props) => {
  const [open, setOpen] = useState(false);

  const renderDescription = (fullText: boolean) => (
    <Markdown
      className={cn(
        "text-sm text-gray-600 leading-relaxed",
        !fullText && "line-clamp-3 overflow-hidden",
      )}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
    >
      {card.description}
    </Markdown>
  );

  return (
    <>
      <GenericCard
        imageUrl={card.imageUrl ?? undefined}
        imageAlt={card.imageAlt ?? undefined}
        title={card.title ?? ""}
        titleSize="text-lg"
        description={renderDescription(false)}
        descriptionLines={3}
        buttonLabel={card.button?.title || "Mehr erfahren"}
        buttonOnClick={(e) => {
          e.stopPropagation();
          if (card.button?.url) {
            if (card.button.openInNewTab) {
              window.open(card.button.url, "_blank");
            } else {
              window.location.href = card.button.url;
            }
          }
        }}
        onClick={() => setOpen(true)}
        className={className}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl">
          <Card className="flex flex-col bg-white p-4 rounded-lg shadow-none">
            <GenericCard
              imageUrl={card.imageUrl ?? undefined}
              imageAlt={card.imageAlt ?? undefined}
              title={card.title ?? ""}
              titleSize="text-xl"
              description={renderDescription(true)}
              buttonLabel={card.button?.title}
              buttonOnClick={(e) => {
                e.stopPropagation();
                if (card.button?.url) {
                  if (card.button.openInNewTab) {
                    window.open(card.button.url, "_blank");
                  } else {
                    window.location.href = card.button.url;
                  }
                }
              }}
            />
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};
