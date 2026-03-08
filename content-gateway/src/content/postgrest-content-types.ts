export type TranslationRecord = Record<string, Record<string, unknown>>;

export type PageRow = {
  id: string;
  translations: TranslationRecord;
};

export type ProjectRow = {
  id: string;
  type: number;
  title: string;
  image_caption: string | null;
  image_url: string | null;
  image_credits: string | null;
  published: boolean;
  deleted: boolean;
  translations: TranslationRecord;
};

export type EventRow = {
  id: string;
  event_id: string;
  termin_id: string;
  start_date: string;
  end_date: string;
  published: boolean;
  deleted: boolean;
  location_id: string;
  coordinates: string | null;
  translations: TranslationRecord;
};

export type LocationRow = {
  id: string;
  city: string | null;
  street: string | null;
  telephone_number: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  zip: string | null;
  translations: TranslationRecord;
};

export type EventCategoryRow = {
  event_id: string;
  category_id: string;
  name: string;
};

export type EventUrlRow = {
  event_id: string;
  id: number;
  link: string;
  description: string;
};

export type EventImageRow = {
  event_id: string;
  original_url: string;
  preview_url: string;
  thumbnail_url: string;
};

export type DropdownRow = {
  id: string;
  rank: number;
  is_link: boolean;
  translations: TranslationRecord;
};

export type TabRow = {
  id: string;
  dropdown_id: string | null;
  sequence: number;
  map_url: string;
  translations: TranslationRecord;
};

export type CardRow = {
  id: string;
  dashboard_tab_id: string;
  sequence: number;
  image_url: string | null;
  translations: TranslationRecord;
  button_translations: TranslationRecord | null;
  button_open_in_new_tab: boolean | null;
};

export type LinkRow = {
  id: string;
  dropdown_id: string;
  link: string;
  sequence: number;
  translations: TranslationRecord;
};

export type FooterRow = {
  id: string;
  name: string;
  content: string;
};

export type BookingTenantRow = {
  id: string;
  tenant_id: string;
};

export type EventFilters = {
  pageNumber: number;
  pageSize: number;
  title?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  ordering?: string;
  distance?: number;
};
