import { CustomTooltip } from "@/components/general/Tooltip";
import { cn } from "@/lib/utils";
import { Link, useLocation } from '@tanstack/react-router';
import { CalendarDaysIcon, HomeIcon, MapIcon, PlaneIcon, ShieldIcon } from "lucide-react";
import React, { createContext, HtmlHTMLAttributes, PropsWithChildren, useContext, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { ServicePortalIcon, SmartCityGubenLogoIcon } from "../icons";
import i18next from "i18next";
import { getLocalizedLanguagename, Language } from "@/utilities/i18n/Languages";
import { WithClassName } from "@/types/WithClassName";
import { useLanguageUpdater } from "@/hooks/useLanguageUpdater";
import { MyGubenIcon } from "../icons/MyGubenIcon";

type TNavContext = { location: string }
const NavContext = createContext<TNavContext>({ location: "/" });

const NavLink = (props: { name: string, to: string, children: React.ReactNode, target?: "_blank" | "_self"}) => {
  const { location } = useContext(NavContext);

  const isActive = useMemo(() => {
    if(props.to == "/") return location == props.to;
    return location.startsWith(props.to);
  }, [location]);

  return (
    <li>
      <CustomTooltip text={props.name}>
        <Link to={props.to} target={props.target} className={cn(
          'h-full p-3 flex items-center justify-center w-auto rounded-xl',
          isActive
            ? "hover:bg-red-400 bg-gubenAccent text-gubenAccent-foreground"
            : "text-gubenAccent stroke-gubenAccent hover:stroke-gubenAccent-foreground hover:bg-gubenAccent hover:text-gubenAccent-foreground"
        )}>
          {props.children ?? props.name}
        </Link>
      </CustomTooltip>
    </li>
  )
}

const NavList = ({ children, className }: PropsWithChildren & WithClassName) => (
  <ul className={cn('flex-1 flex gap-2 h-full items-center justify-center self-center', className)}>
    {children}
  </ul>
);

export const Navbar = () => {
  const iconStyle = "icon size-8";
  const { t } = useTranslation("navigation");
  const location = useLocation();

  return (
    <NavContext.Provider value={{ location: location.pathname }}>
      <div className="w-full h-20 bg-white sticky top-0 shadow py-12 pr-2 rounded-b flex items-center justify-between z-50">
        <div id="logo" className="flex-1 flex justify-start items-center h-full pl-5">
          <Link to="/" className="h-full flex justify-center items-center">
            <SmartCityGubenLogoIcon className="w-[128px] h-auto" />
          </Link>
        </div>

        <NavList>
          <NavLink to="/" name={t("Dashboard")}>
            <div className="flex flex-col items-center w-24">
              <HomeIcon className={iconStyle} />
              <span className="mt-1 font-nunito">{t('Dashboard')}</span>
            </div>
          </NavLink>
          <NavLink to="/projects" name={t("Projects")}>
            <div className="flex flex-col items-center w-24">
              <MyGubenIcon className={iconStyle} />
              <span className="mt-1 font-nunito">{t('Projects')}</span>
            </div>
          </NavLink>
          <NavLink to="/map" name={t("Map")}>
            <div className="flex flex-col items-center w-24">
              <MapIcon className={iconStyle} />
              <span className="mt-1 font-nunito">{t('Map')}</span>
            </div>
          </NavLink>
          <NavLink to="/events" name={t("Events")}>
            <div className="flex flex-col items-center w-24">
              <CalendarDaysIcon className={iconStyle} />
              <span className="mt-1 font-nunito">{t('Events')}</span>
            </div>
          </NavLink>
          <NavLink to="/booking" name={t("Booking")}>
            <div className="flex flex-col items-center w-24">
              <PlaneIcon className={iconStyle} />
              <span className="mt-1 font-nunito">{t('Booking')}</span>
            </div>
          </NavLink>
          <NavLink name={t("ServicePortal")} to="https://serviceportal.dikom-bb.de/stadt-guben" target="_blank">
            <div className="flex flex-col items-center w-24">
              <ServicePortalIcon className={iconStyle} />
              <span className="mt-1 whitespace-nowrap font-nunito">{t('ServicePortal')}</span>
            </div>
          </NavLink>
        </NavList>

        <NavList className={"justify-end"}>
          <li>
            <CustomTooltip text="Admin">
              <a
                href="https://booking.guben.de/login/sso"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 flex items-center justify-center rounded-xl text-gubenAccent hover:bg-gubenAccent hover:text-gubenAccent-foreground"
              >
                <ShieldIcon className="size-6" />
              </a>
            </CustomTooltip>
          </li>
          <LanguageSection/>
        </NavList>

      </div>
    </NavContext.Provider>
  )
}


const LanguageSection = () => {
  const updateLanguage = useLanguageUpdater();
  const currentLanguage = i18next.language.split('-')[0];

  return (
    <div className="relative flex items-center justify-center">
      <div className="group">
        {/* Display current language */}
        <button className="p-2 rounded-lg text-[#cd1421] group-hover:bg-[#cd1421] group-hover:text-white">
          {getLocalizedLanguagename(currentLanguage)}
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 hidden rounded-lg shadow-lg group-hover:block bg-white border ">
          {Object.values(Language).map((lang) => (
            <button
              key={lang}
              className="w-full text-left px-3 py-2 rounded-lg text-[#cd1421] hover:bg-[#cd1421] hover:text-white"
              onClick={async () => await updateLanguage(lang)}
            >
              {getLocalizedLanguagename(lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
