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
}

const GatewayFooter = () => {
  const {data: footerItemResponse, isPending} = useGatewayFooterContent();
  const { t } = useTranslation("common");

  if (!isGatewayPublicContentEnabled) {
    return (
      <footer className="bg-gubenAccent relative text-gubenAccent-foreground p-4 h-14 flex justify-center items-center">
        <BaseImgTag src="/images/guben-logo.jpg" alt="logo" className={"h-full left-2 absolute"}/>
        <p className="text-sm">Oeffentliche Inhalte deaktiviert</p>
      </footer>
    );
  }

  const footerLinks = [
    { name: t("Footer.PrivacyPolicy.name"), url: t("Footer.PrivacyPolicy.url") },
    { name: t("Footer.Imprint.name"), url: t("Footer.Imprint.url") },
    { name: t("Footer.Accessibility.name"), url: t("Footer.Accessibility.url") },
    { name: t("Footer.Contact.name"), url: t("Footer.Contact.url") },
  ];

  return (
    <footer className="bg-gubenAccent relative text-gubenAccent-foreground p-4 h-14 flex justify-center items-center">
      <BaseImgTag src="/images/guben-logo.jpg" alt="logo" className={"h-full left-2 absolute"}/>
      <ul className={"flex flex-row gap-10"}>
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
    </footer>
  )
}

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
        "flex flex-col gap-4 p-16",
        "min-w-[100svw] max-w-[100svw] min-h-[100svh] max-h-[100svh] md:min-w-[80svw] md:max-w-[80svw] md:min-h-[80svh] md:max-h-[80svh]"
      )}>
        <DialogHeader className="gap-4">
          <DialogTitle className="text-4xl">{footerItem.name}</DialogTitle>
        </DialogHeader>

        {!isNullOrUndefinedOrWhiteSpace(footerItem.content) &&
          <DialogDescription>
            {/*<div className="text-neutral-800" dangerouslySetInnerHTML={{ __html: sanitizeHtml(footerItem.content!) }} />*/}
            <div className="text-neutral-800" dangerouslySetInnerHTML={{__html: footerItem.content!}}/>
          </DialogDescription>
        }
      </DialogContent>
    </Dialog>
  )
}
