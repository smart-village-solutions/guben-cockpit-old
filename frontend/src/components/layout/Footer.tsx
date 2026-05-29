import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isNullOrUndefinedOrWhiteSpace } from "@/utilities/nullabilityUtils";
import { BaseImgTag } from "@/components/ui/BaseImgTag";
import { useGatewayFooterContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useTranslation } from "react-i18next";
import type { FooterItem } from "@shared/public-content/contracts";

export const Footer = () => {
  return <GatewayFooter />;
};

type FooterLink = {
  name: string;
  url: string;
};

const GatewayFooter = () => {
  const {data: footerItemResponse, isPending} = useGatewayFooterContent();
  const { t } = useTranslation("common");

  if (!isGatewayPublicContentEnabled) {
    return (
      <footer className="relative mt-5 flex min-h-14 items-center justify-center bg-gubenAccent p-4 text-gubenAccent-foreground">
        <BaseImgTag src="/images/guben-logo.jpg" alt="logo" className={"absolute left-2 hidden h-full md:block"}/>
        <p className="text-sm">Oeffentliche Inhalte deaktiviert</p>
      </footer>
    );
  }

  const footerLinks: FooterLink[] = [
    { name: t("Footer.PrivacyPolicy.name") as string, url: t("Footer.PrivacyPolicy.url") as string },
    { name: t("Footer.Imprint.name") as string, url: t("Footer.Imprint.url") as string },
    { name: t("Footer.Accessibility.name") as string, url: t("Footer.Accessibility.url") as string },
    { name: t("Footer.Contact.name") as string, url: t("Footer.Contact.url") as string },
  ];

  return (
    <footer className="relative mt-5 bg-gubenAccent px-4 py-3 text-gubenAccent-foreground md:h-14 md:py-4">
      <BaseImgTag src="/images/guben-logo.jpg" alt="logo" className={"absolute left-2 top-1/2 hidden h-full -translate-y-1/2 md:block"}/>
      <div className="flex flex-col items-center gap-3 md:h-full md:justify-center">
        <BaseImgTag src="/images/guben-logo.jpg" alt="logo" className={"h-10 w-auto md:hidden"}/>
        <ul className={"flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm md:flex-nowrap md:gap-10 md:text-base"}>
        {
          isPending
            ? <LoadingIndicator/>
            : footerItemResponse?.items?.map((item: FooterItem, index: number) => (
              <li key={index}>
                <FooterItemDialog footerItem={item}/>
              </li>
            ))
        }
        {footerLinks.map((link, index) => (
          <li key={`footer-link-${index}`}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {link.name}
            </a>
          </li>
        ))}
        </ul>
      </div>
    </footer>
  );
};

interface FooterItemDialogProps {
  footerItem: FooterItem;
}

// TODO: customize the sanitize html so it allows for inline styling for colored text, images etc
export default function FooterItemDialog({footerItem}: FooterItemDialogProps) {
  return (
    <Dialog>
      <DialogTrigger>{footerItem.name}</DialogTrigger>
      <DialogContent className={cn(
        "bg-white rounded-lg text-lg",
        "flex flex-col gap-4 p-4 sm:p-8 md:p-16",
        "min-w-[100svw] max-w-[100svw] min-h-[100svh] max-h-[100svh] md:min-w-[80svw] md:max-w-[80svw] md:min-h-[80svh] md:max-h-[80svh]"
      )}>
        <DialogHeader className="gap-4">
          <DialogTitle className="text-2xl sm:text-3xl md:text-4xl">{footerItem.name}</DialogTitle>
        </DialogHeader>

        {!isNullOrUndefinedOrWhiteSpace(footerItem.content) &&
          <DialogDescription>
            {/*<div className="text-neutral-800" dangerouslySetInnerHTML={{ __html: sanitizeHtml(footerItem.content!) }} />*/}
            <div className="text-neutral-800" dangerouslySetInnerHTML={{__html: footerItem.content!}}/>
          </DialogDescription>
        }
      </DialogContent>
    </Dialog>
  );
}
