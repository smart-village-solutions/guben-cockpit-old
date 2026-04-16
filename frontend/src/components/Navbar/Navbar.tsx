import { CustomTooltip } from "@/components/general/Tooltip";
import { cn } from "@/lib/utils";
import { Link, useLocation } from '@tanstack/react-router';
import { CalendarDaysIcon, HomeIcon, MapIcon, PlaneIcon, ShieldIcon } from "lucide-react";
import React, { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { ServicePortalIcon, SmartCityGubenLogoIcon } from "../icons";
import i18next from "i18next";
import { getLocalizedLanguagename, Language } from "@/utilities/i18n/Languages";
import { WithClassName } from "@/types/WithClassName";
import { useLanguageUpdater } from "@/hooks/useLanguageUpdater";
import { MyGubenIcon } from "../icons/MyGubenIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type TNavContext = { location: string }
const NavContext = createContext<TNavContext>({ location: "/" });

const NavLink = (props: { name: string, to: string, children: React.ReactNode, target?: "_blank" | "_self"}) => {
  const { location } = useContext(NavContext);

  const isActive = useMemo(() => {
    if(props.to == "/") return location == props.to;
    return location.startsWith(props.to);
  }, [location]);

  return (
    <li className="h-auto">
      <CustomTooltip text={props.name}>
        <Link to={props.to} target={props.target} className={cn(
          'px-3 py-1.5 mt-3 mb-3 flex items-center justify-center w-auto rounded-xl',
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
  <ul className={cn('flex-1 flex gap-2 h-full items-center justify-center self-center py-0', className)}>
    {children}
  </ul>
);

type NavigationLabelKey = "Dashboard" | "Projects" | "Map" | "Events" | "Booking" | "ServicePortal";

const navItems = [
  { to: "/", labelKey: "Dashboard", icon: HomeIcon },
  { to: "/projects", labelKey: "Projects", icon: MyGubenIcon },
  { to: "/map", labelKey: "Map", icon: MapIcon },
  { to: "/events", labelKey: "Events", icon: CalendarDaysIcon },
  { to: "/booking", labelKey: "Booking", icon: PlaneIcon },
  { to: "https://serviceportal.dikom-bb.de/stadt-guben", labelKey: "ServicePortal", icon: ServicePortalIcon, target: "_blank" as const },
] satisfies Array<{
  to: string;
  labelKey: NavigationLabelKey;
  icon: React.ComponentType<{ className?: string }>;
  target?: "_blank";
}>;

export const Navbar = () => {
  const iconStyle = "icon size-8";
  const { t } = useTranslation("navigation");
  const location = useLocation();

  return (
    <NavContext.Provider value={{ location: location.pathname }}>
      <div className="sticky top-0 z-50 w-full overflow-hidden rounded-b bg-white shadow">
        <div className="lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div id="logo" className="min-w-0">
              <Link
                to="/"
                search={() => ({ selectedTabId: undefined })}
                className="flex items-center"
              >
                <SmartCityGubenLogoIcon className="h-auto w-[112px]" />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <AdminLink />
              <LanguageSection compact />
            </div>
          </div>

          <nav aria-label={t("Dashboard")} className="border-t border-neutral-200 px-2 pb-2 pt-1">
            <ul className="flex items-stretch gap-2 overflow-x-auto pb-1">
              {navItems.map(({ to, labelKey, icon: Icon, target }) => (
                <li key={to} className="shrink-0">
                  <NavLink to={to} name={t(labelKey)} target={target}>
                    <div className="flex min-w-[72px] flex-col items-center px-1">
                      <Icon className="size-6" />
                      <span className="mt-1 text-center text-[11px] font-nunito leading-tight">
                        {t(labelKey)}
                      </span>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="hidden h-20 w-full grid-cols-[auto_1fr_auto] items-center gap-5 px-4 lg:grid">
          <div id="logo" className="flex h-full items-center justify-start">
            <Link
              to="/"
              search={() => ({ selectedTabId: undefined })}
              className="flex h-full items-center justify-center"
            >
              <SmartCityGubenLogoIcon className="h-auto w-[128px]" />
            </Link>
          </div>

          <div className="flex min-w-0 items-center justify-center">
            <NavList className="flex-none">
              {navItems.map(({ to, labelKey, icon: Icon, target }) => (
                <NavLink key={to} to={to} name={t(labelKey)} target={target}>
                  <div className="flex w-20 flex-col items-center">
                    <Icon className={iconStyle} />
                    <span className="mt-1 text-xs font-nunito whitespace-nowrap">{t(labelKey)}</span>
                  </div>
                </NavLink>
              ))}
            </NavList>
          </div>

          <NavList className="flex-none justify-end">
            <li>
              <AdminLink />
            </li>
            <LanguageSection />
          </NavList>
        </div>
      </div>
    </NavContext.Provider>
  )
}


const AdminLink = () => (
  <CustomTooltip text="Admin">
    <a
      href="https://booking.guben.de/login/sso"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center rounded-xl p-1.5 text-gubenAccent hover:bg-gubenAccent hover:text-gubenAccent-foreground"
      aria-label="Admin"
    >
      <ShieldIcon className="size-6" />
    </a>
  </CustomTooltip>
);

const LanguageSection = ({ compact = false }: { compact?: boolean }) => {
  const updateLanguage = useLanguageUpdater();
  const currentLanguage = i18next.language.split('-')[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "rounded-lg text-[#cd1421] hover:bg-[#cd1421] hover:text-white",
            compact ? "h-9 px-2 text-sm" : "mx-3 h-9 px-3 text-base",
          )}
          aria-label="Sprache wählen"
        >
          {getLocalizedLanguagename(currentLanguage)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        {Object.values(Language).map((lang) => (
          <DropdownMenuItem
            key={lang}
            className={cn(
              "cursor-pointer",
              lang === currentLanguage && "font-semibold",
            )}
            onClick={async () => await updateLanguage(lang)}
          >
            {getLocalizedLanguagename(lang)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
