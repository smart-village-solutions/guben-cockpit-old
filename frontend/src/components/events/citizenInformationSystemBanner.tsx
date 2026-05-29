import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { MessageSquareWarningIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MapComponent } from "../home/MapComponent";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function CitizenInformationSystemBanner() {
  const {t} = useTranslation("events");

  return (
    <section className="w-full bg-gubenAccent text-gubenAccent-foreground">
      <div className="mx-auto flex w-full max-w-7xl gap-2 px-4 py-4">
        <MessageSquareWarningIcon className="mt-0.5 shrink-0" />
        <p>{t("CitizenInformationText")}</p>
        <Dialog>
          <DialogTrigger>
            <a className={"underline"}>{t("ClickHere")}</a>
          </DialogTrigger>
          <DialogContent className="w-5/6 max-w-full h-5/6 p-1 pt-12">
            <VisuallyHidden>
              <DialogTitle>Bürgerbeteiligungssystem</DialogTitle>
            </VisuallyHidden>
            <MapComponent src={"https://www.sessionnet.guben.de/buergerinfo"} className={"h-full"} />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
