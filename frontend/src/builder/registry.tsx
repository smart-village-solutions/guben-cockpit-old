import { Builder, builder } from "@builder.io/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BaseImgTag } from "@/components/ui/BaseImgTag";
import { builderPublicApiKey } from "./config";

type BuilderCallToActionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

function BuilderCallToAction({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: BuilderCallToActionProps) {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 rounded-3xl bg-gubenAccent px-8 py-10 text-gubenAccent-foreground shadow-lg md:px-12 md:py-14">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.2em]">{eyebrow}</p> : null}
      <div className="max-w-3xl space-y-4">
        <h2 className="font-poppins text-4xl font-bold md:text-5xl">{title}</h2>
        {description ? <p className="text-lg leading-8 text-white/90">{description}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">
        {primaryLabel && primaryHref ? (
          <Button asChild className="bg-white text-gubenAccent hover:bg-white/90">
            <a href={primaryHref}>{primaryLabel}</a>
          </Button>
        ) : null}
        {secondaryLabel && secondaryHref ? (
          <Button asChild variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-gubenAccent">
            <a href={secondaryHref}>{secondaryLabel}</a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

type BuilderFeatureCardProps = {
  title: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

function BuilderFeatureCard({
  title,
  text,
  imageUrl,
  imageAlt,
  ctaLabel,
  ctaHref,
}: BuilderFeatureCardProps) {
  return (
    <Card className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border-0 shadow-xl">
      {imageUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#808080]">
          <BaseImgTag
            src={imageUrl}
            alt={imageAlt ?? title}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>
      ) : null}
      <CardHeader className="pb-3">
        <CardTitle className="font-poppins text-2xl text-gubenAccent">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {text ? <p className="leading-7 text-slate-600">{text}</p> : null}
        {ctaLabel && ctaHref ? (
          <Button asChild variant="destructive">
            <a href={ctaHref}>{ctaLabel}</a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

if (builderPublicApiKey) {
  builder.init(builderPublicApiKey);
}

Builder.registerComponent(BuilderCallToAction, {
  name: "Call To Action",
  inputs: [
    { name: "eyebrow", type: "string", defaultValue: "Guben Cockpit" },
    { name: "title", type: "string", defaultValue: "Gestalte Landingpages in Builder.io." },
    {
      name: "description",
      type: "longText",
      defaultValue: "Nutze diese Komponente fuer markante Einstiegsbereiche mit konsistentem Branding.",
    },
    { name: "primaryLabel", type: "string", defaultValue: "Mehr erfahren" },
    { name: "primaryHref", type: "url", defaultValue: "/" },
    { name: "secondaryLabel", type: "string", defaultValue: "Kontakt" },
    { name: "secondaryHref", type: "url", defaultValue: "/kontakt" },
  ],
});

Builder.registerComponent(BuilderFeatureCard, {
  name: "Feature Card",
  inputs: [
    { name: "title", type: "string", defaultValue: "Projekt vorstellen" },
    {
      name: "text",
      type: "longText",
      defaultValue: "Zeige Inhalte mit einem Bild, kurzer Beschreibung und klarer Aktion.",
    },
    { name: "imageUrl", type: "file", allowedFileTypes: ["jpeg", "jpg", "png", "webp", "svg"] },
    { name: "imageAlt", type: "string", defaultValue: "Feature Bild" },
    { name: "ctaLabel", type: "string", defaultValue: "Zum Inhalt" },
    { name: "ctaHref", type: "url", defaultValue: "/" },
  ],
});
