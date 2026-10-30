import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isNullOrUndefinedOrWhiteSpace } from "@/utilities/nullabilityUtils";
import { BaseImgTag } from "@/components/ui/BaseImgTag";
import { useGatewayFooterContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useTranslation } from "react-i18next";
import sanitizeHtml from "sanitize-html";
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
            : footerItemResponse?.items?.map((item: FooterItem) => (
              <li key={item.id}>
                <FooterItemDialog footerItem={item}/>
              </li>
            ))
        }
        {footerLinks.map((link) => (
          <li key={link.url}>
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

const footerColorStyles = [/^#[\da-f]+$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i];

export default function FooterItemDialog({footerItem}: Readonly<FooterItemDialogProps>) {
  const content = sanitizeHtml(footerItem.content ?? "", {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["style"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedStyles: {
      "*": {
        color: footerColorStyles,
        "background-color": footerColorStyles,
        "text-align": [/^(left|right|center|justify)$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic)$/],
        "font-size": [/^\d+(\.\d+)?(px|em|rem|%)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
      },
    },
  });
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
            <div className="text-neutral-800" dangerouslySetInnerHTML={{__html: content}}/>
          </DialogDescription>
        }
      </DialogContent>
    </Dialog>
  );
}
