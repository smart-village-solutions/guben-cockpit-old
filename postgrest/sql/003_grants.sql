REVOKE ALL ON SCHEMA "Guben" FROM guben_public_content_reader;
REVOKE ALL ON ALL TABLES IN SCHEMA "Guben" FROM guben_public_content_reader;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "Guben" FROM guben_public_content_reader;

GRANT USAGE ON SCHEMA public_content TO guben_public_content_reader;
GRANT SELECT ON
  public_content.pages,
  public_content.projects,
  public_content.locations,
  public_content.events,
  public_content.event_categories,
  public_content.event_urls,
  public_content.event_images,
  public_content.dashboard_dropdowns,
  public_content.dashboard_tabs,
  public_content.information_cards,
  public_content.dropdown_links,
  public_content.footer_items,
  public_content.booking_tenants
TO guben_public_content_reader;

ALTER DEFAULT PRIVILEGES IN SCHEMA public_content
  GRANT SELECT ON TABLES TO guben_public_content_reader;
