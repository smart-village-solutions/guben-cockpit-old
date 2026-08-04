import { SortDescIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";

export enum SortOption {
  NONE = "none",
  TITLE = "title",
  START_DATE = "startDate",
}

export enum SortOrder {
  ASC = "ascending",
  DESC = "descending"
}

type Props = {
  option?: string,
  order?: string,
  options?: Array<{ value: string; label: string }>,
  includeNone?: boolean,
  ariaLabel?: string,
  triggerClassName?: string,
  onChange: (options?: string, order?: string) => unknown;
}

export default function SortFilter({
  option = SortOption.NONE,
  order = SortOrder.ASC,
  options = [
    { value: SortOption.TITLE, label: "" },
    { value: SortOption.START_DATE, label: "" },
  ],
  includeNone = true,
  ariaLabel,
  triggerClassName,
  onChange
}: Props) {
  const {t} = useTranslation("common");
  const resolvedOptions = options.map((entry) => ({
    ...entry,
    label: entry.label || (entry.value === SortOption.TITLE ? t("Sorting.Title") : t("Sorting.Date")),
  }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={triggerClassName} aria-label={ariaLabel ?? t("Sorting.Option")}><SortDescIcon className="size-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="flex flex-col gap-2">
        <DropdownMenuLabel>{t("Sorting.Option")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={option} onValueChange={v => onChange(v == "none" ? undefined : v, order)}>
          {includeNone && <DropdownMenuRadioItem value={SortOption.NONE}>({t("Sorting.None")})</DropdownMenuRadioItem>}
          {resolvedOptions.map((entry) => (
            <DropdownMenuRadioItem key={entry.value} value={entry.value}>{entry.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuLabel>{t("Sorting.Order")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={order} onValueChange={v => onChange(option, v)}>
          <DropdownMenuRadioItem value={SortOrder.ASC}>{t("Sorting.Ascending")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SortOrder.DESC}>{t("Sorting.Descending")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
