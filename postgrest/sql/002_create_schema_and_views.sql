CREATE SCHEMA IF NOT EXISTS public_content;

REVOKE ALL ON SCHEMA public_content FROM PUBLIC;

CREATE OR REPLACE VIEW public_content.pages AS
SELECT
  "Id" AS id,
  "Translations" AS translations
FROM "Guben"."Page";

CREATE OR REPLACE VIEW public_content.projects AS
SELECT
  "Id" AS id,
  "Type" AS type,
  "Title" AS title,
  "ImageCaption" AS image_caption,
  "ImageUrl" AS image_url,
  "ImageCredits" AS image_credits,
  "Published" AS published,
  "Deleted" AS deleted,
  "Translations" AS translations
FROM "Guben"."Project";

CREATE OR REPLACE VIEW public_content.locations AS
SELECT
  "Id" AS id,
  "City" AS city,
  "Street" AS street,
  "TelephoneNumber" AS telephone_number,
  "Fax" AS fax,
  "Email" AS email,
  "Website" AS website,
  "Zip" AS zip,
  "Translations" AS translations
FROM "Guben"."Location";

CREATE OR REPLACE VIEW public_content.events AS
SELECT
  "Id" AS id,
  "EventId" AS event_id,
  "TerminId" AS termin_id,
  "StartDate" AS start_date,
  "EndDate" AS end_date,
  "Published" AS published,
  "Deleted" AS deleted,
  "LocationId" AS location_id,
  "Coordinates" AS coordinates,
  "Translations" AS translations
FROM "Guben"."Event";

CREATE OR REPLACE VIEW public_content.event_categories AS
SELECT
  ec."EventsId" AS event_id,
  ec."CategoriesId" AS category_id,
  c."Name" AS name
FROM "Guben"."EventCategory" ec
JOIN "Guben"."Category" c
  ON c."Id" = ec."CategoriesId";

CREATE OR REPLACE VIEW public_content.event_urls AS
SELECT
  "EventId" AS event_id,
  "Id" AS id,
  "Link" AS link,
  "Description" AS description
FROM "Guben"."Url";

CREATE OR REPLACE VIEW public_content.event_images AS
SELECT
  "EventId" AS event_id,
  "OriginalUrl" AS original_url,
  "PreviewUrl" AS preview_url,
  "ThumbnailUrl" AS thumbnail_url
FROM "Guben"."EventImages";

CREATE OR REPLACE VIEW public_content.dashboard_dropdowns AS
SELECT
  "Id" AS id,
  "Rank" AS rank,
  "IsLink" AS is_link,
  "Translations" AS translations
FROM "Guben"."DashboardDropdown";

CREATE OR REPLACE VIEW public_content.dashboard_tabs AS
SELECT
  "Id" AS id,
  "DropdownId" AS dropdown_id,
  "Sequence" AS sequence,
  "MapUrl" AS map_url,
  "Translations" AS translations
FROM "Guben"."DashboardTab";

CREATE OR REPLACE VIEW public_content.information_cards AS
SELECT
  "Id" AS id,
  "DashboardTabId" AS dashboard_tab_id,
  "Sequenece" AS sequence,
  "ImageUrl" AS image_url,
  "Translations" AS translations,
  "Button_Translations" AS button_translations,
  "Button_OpenInNewTab" AS button_open_in_new_tab
FROM "Guben"."InformationCard";

CREATE OR REPLACE VIEW public_content.dropdown_links AS
SELECT
  "Id" AS id,
  "DropdownId" AS dropdown_id,
  "Link" AS link,
  "Sequence" AS sequence,
  "Translations" AS translations
FROM "Guben"."DropdownLink";

CREATE OR REPLACE VIEW public_content.footer_items AS
SELECT
  "Id" AS id,
  "Name" AS name,
  "Content" AS content
FROM "Guben"."FooterItem";

CREATE OR REPLACE VIEW public_content.booking_tenants AS
SELECT
  "Id" AS id,
  "TenantId" AS tenant_id
FROM "Guben"."Booking"
WHERE "ForPublicUse" = TRUE;
