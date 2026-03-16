import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

export default function BookingHeader()  {
  const { t } = useTranslation("booking");

  return (
    <div className="relative w-full h-72 overflow-hidden bg-gray-300">
      <div className="absolute bottom-0 left-0 w-full h-1/3 flex flex-col items-center justify-center bg-red-600/70">
        <div className="mt-1 text-gubenAccent-foreground font-bold italic text-6xl tracking-tight">
          {t("booking")}
        </div>
        <div className="my-2 flex gap-10 justify-center text-gubenAccent-foreground">
          <a href="#rooms" className="hover:underline">{t("rooms")}</a>
          <a href="#sport_facilities" className="hover:underline">{t("sportFacilities")}</a>
          <a href="#resources" className="hover:underline">{t("resources")}</a>
          <Link to="/events" className="hover:underline">{t("events")}</Link>
        </div>
      </div>
    </div>
  );
}
