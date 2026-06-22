import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { MessageSquareWarningIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MapComponent } from "../home/MapComponent";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function CitizenInformationSystemBanner() {
  const {t} = useTranslation("events");

  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <div className="flex w-full gap-2 rounded-md bg-gubenAccent px-4 py-4 text-gubenAccent-foreground">
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
