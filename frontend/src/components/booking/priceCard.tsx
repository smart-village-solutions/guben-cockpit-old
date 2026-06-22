import { CircleCheckIcon } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { BaseImgTag } from "@/components/ui/BaseImgTag";
import { useTranslation } from "react-i18next";
import { TranslatedHtml, TranslatedText } from "@/utilities/translateUtils";
import BookingAvailability from "./BookingAvailability";

type PriceCardProps = {
  bookingUrl: string;
  price?: string;
  title: string;
  flags?: string[];
  description?: string;
  location?: string;
  autoCommitNote?: string;
  imgUrl?: string;
  prices?: { price: string; interval?: string; category?: string }[];
  tenantId?: string;
  bookableId?: string;
}

export default function ({
  bookingUrl,
  price,
  title,
  flags,
  description,
  location,
  autoCommitNote,
  imgUrl,
  prices,
  tenantId,
  bookableId,
}: PriceCardProps) {
  const { t } = useTranslation("booking");

  const isValidUrl = bookingUrl && bookingUrl.startsWith("http");

  return (
    <div className="px-0 py-5">
      <Card className="shadow-lg">
        <div className="grid grid-cols-3 gap-5 h-full">
          <div className="col-span-2 bg-gubenAccent-foreground h-full">
            {!isValidUrl &&
              <div className="px-5 py-1 font-bold text-gubenAccent">{t('notBookable')}</div>
            }
            <div className="p-5 font-bold text-xl">
              {title}
            </div>
            <hr className="border-2 border-gubenAccent w-2/3" />
            {description && (
              <TranslatedHtml
                text={description}
                className={
                  !flags || flags.length === 0 ? "px-5 pb-5" : "px-5"
                }
              />
            )}
            { flags && flags.length > 0 && (
              <div className="p-5">
                <div className="font-bold">
                  {t("priceCard.included")}
                </div>
                <div className="flex flex-col gap-2">
                  {flags.map((flag) => (
                    <div className="flex items-center" key={flag}>
                      <CircleCheckIcon className="mr-1 size-4 text-green-700" />
                      <div className="text-gray-700">
                        <TranslatedText text={flag} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="col-span-1 relative h-full overflow-hidden bg-[#808080] font-bold text-gubenAccent-foreground"
          >
            {imgUrl ? (
              <BaseImgTag
                src={imgUrl}
                alt={title}
                className="absolute inset-0 h-full w-full object-contain"
              />
            ) : null}
            <div className="absolute inset-0 bg-red-600/50" />
            <div className="relative z-10 h-full flex flex-col justify-between items-start p-5">
              {/* Price Information */}
              <div>
                {prices && prices.length > 0 ? (
                  prices.map((p, idx) => (
                    <p key={idx}>
                      {t("priceCard.price")}: {p.price}
                      {p.interval && ` (${p.interval})`}
                      {p.category && ` - ${p.category}`}
                    </p>
                  ))
                ) : (
                  <p>{t("priceCard.price")}: {price}</p>
                )}

                { location && (
                  <p>{t("priceCard.place")}: {location}</p>
                )}
                { autoCommitNote && (
                  <TranslatedText text={autoCommitNote}/>
                )}
                <BookingAvailability tenantId={tenantId} bookableId={bookableId} />
              </div>

              {/* CTA Button */}
              {isValidUrl && (
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button
                    className="w-full bg-gubenAccent text-white hover:bg-red-700"
                  >
                    Jetzt buchen
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
