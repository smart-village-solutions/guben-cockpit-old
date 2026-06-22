import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { MapComponent } from "@/components/home/MapComponent";
import { InfoCard } from "@/components/home/InfoCard/InfoCard";
import { cn } from "@/lib/utils";
import type { DashboardDropdown } from "@shared/public-content/contracts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardDropdownTabsProps {
  dropdowns: DashboardDropdown[];
}

export const DashboardDropdownTabs = ({
  dropdowns,
}: DashboardDropdownTabsProps) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const allTabs = useMemo(() => {
    const tabs: DashboardDropdown["tabs"][number][] = [];
    dropdowns.forEach((d) => {
      if (d.tabs) {
        d.tabs.forEach((t) => {
          tabs.push(t);
        });
      }
    });
    return tabs;
  }, [dropdowns]);

  const tab = useMemo(
    () => allTabs.find((t) => t.id === activeTab) || null,
    [allTabs, activeTab],
  );
  const items = useMemo(
    () =>
      dropdowns.flatMap((dropdown) => {
        const groupLabel = dropdown.title;

        if (dropdown.isLink) {
          return [
            { type: "group" as const, key: `group-${dropdown.id}`, label: groupLabel },
            ...(dropdown.links ?? []).map((link) => ({
              type: "link" as const,
              key: link.id,
              label: link.title,
              groupLabel,
              onSelect: () => {
                window.open(link.link, "_blank", "noopener,noreferrer");
                setOpen(false);
              },
            })),
          ];
        }

        return [
          { type: "group" as const, key: `group-${dropdown.id}`, label: groupLabel },
          ...(dropdown.tabs ?? []).map((entry) => ({
            type: "tab" as const,
            key: entry.id,
            label: entry.title,
            groupLabel,
            active: entry.id === activeTab,
            onSelect: () => {
              setActiveTab(entry.id);
              setOpen(false);
            },
          })),
        ];
      }),
    [activeTab, dropdowns],
  );
  const activeItemLabel = useMemo(
    () => allTabs.find((entry) => entry.id === activeTab)?.title ?? null,
    [activeTab, allTabs],
  );

  useEffect(() => {
    if (!activeTab && allTabs.length > 0) {
      setActiveTab(allTabs[0].id);
    }
  }, [activeTab, allTabs]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-md bg-gubenAccent px-4 py-3 text-white lg:flex-row lg:items-center">
        <p className="font-semibold">Wählen Sie Ihre Themenkarte:</p>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-auto min-h-10 w-full justify-between rounded-md border border-white/30 bg-white px-3 py-2 text-left text-sm font-semibold text-black hover:bg-white hover:text-black lg:w-[24rem]",
                "data-[state=open]:bg-white",
              )}
            >
              <span className="truncate">{activeItemLabel ?? "Bitte auswählen"}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-80" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="bottom"
            sideOffset={6}
            collisionPadding={8}
            className="w-[24rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <ScrollArea className="max-h-80">
              <div className="py-1">
                {items.map((item) =>
                  item.type === "group" ? (
                    <div
                      key={item.key}
                      className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {item.label}
                    </div>
                  ) : (
                    <DropdownMenuItem
                      key={item.key}
                      onClick={item.onSelect}
                      className={cn(
                        "cursor-pointer rounded-sm pl-6",
                        "focus:bg-accent focus:text-accent-foreground",
                        item.type === "tab" && item.active && "font-semibold",
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                    </DropdownMenuItem>
                  ),
                )}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeTab && tab && (
        <div key={activeTab} className={"flex h-full min-h-[70vh] flex-col gap-4 lg:flex-row lg:gap-0"}>
          <MapComponent
            src={tab.mapUrl}
            className="min-h-[18rem] overflow-hidden rounded-lg bg-white shadow-sm lg:min-h-0 lg:rounded-none lg:bg-transparent lg:shadow-none"
          />
          <div className={"flex-1 h-full px-0 pt-2 lg:px-4"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-fr">
              {tab?.informationCards?.map((card, index) => {
                return <InfoCard key={index} card={card} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
