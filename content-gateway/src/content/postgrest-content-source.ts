import { PostgrestClient } from "../upstream/postgrest-client.js";
import {
  BookingTenantRow,
  CardRow,
  DropdownRow,
  EventCategoryRow,
  EventImageRow,
  EventRow,
  EventUrlRow,
  FooterRow,
  LinkRow,
  LocationRow,
  PageRow,
  ProjectRow,
  TabRow,
} from "./postgrest-content-types.js";

export class PostgrestContentSource {
  public constructor(private readonly client: PostgrestClient) {}

  public getPage(id: string): Promise<PageRow[]> {
    return this.client.select<PageRow>("pages", {
      id: `eq.${id}`,
      select: "id,translations",
    });
  }

  public getProjects(): Promise<ProjectRow[]> {
    return this.client.select<ProjectRow>("projects", {
      select: "id,type,title,image_caption,image_url,image_credits,published,deleted,translations",
    });
  }

  public async getEventsBundle() {
    const [eventRows, locationRows, categoryRows, urlRows, imageRows, bookingTenantRows] =
      await Promise.all([
        this.client.select<EventRow>("events", {
          select:
            "id,event_id,termin_id,start_date,end_date,published,deleted,location_id,coordinates,translations",
        }),
        this.client.select<LocationRow>("locations", {
          select: "id,city,street,telephone_number,fax,email,website,zip,translations",
        }),
        this.client.select<EventCategoryRow>("event_categories", {
          select: "event_id,category_id,name",
        }),
        this.client.select<EventUrlRow>("event_urls", {
          select: "event_id,id,link,description",
        }),
        this.client.select<EventImageRow>("event_images", {
          select: "event_id,original_url,preview_url,thumbnail_url",
        }),
        this.client.select<BookingTenantRow>("booking_tenants", {
          select: "id,tenant_id",
        }),
      ]);

    return {
      eventRows,
      locationRows,
      categoryRows,
      urlRows,
      imageRows,
      bookingTenantRows,
    };
  }

  public async getEventDetailBundle(id: string) {
    const eventRow = (
      await this.client.select<EventRow>("events", {
        id: `eq.${id}`,
        select:
          "id,event_id,termin_id,start_date,end_date,published,deleted,location_id,coordinates,translations",
      })
    )[0];

    if (!eventRow) {
      return null;
    }

    const [locationRows, categoryRows, urlRows, imageRows] = await Promise.all([
      this.client.select<LocationRow>("locations", {
        id: `eq.${eventRow.location_id}`,
        select: "id,city,street,telephone_number,fax,email,website,zip,translations",
      }),
      this.client.select<EventCategoryRow>("event_categories", {
        event_id: `eq.${eventRow.id}`,
        select: "event_id,category_id,name",
      }),
      this.client.select<EventUrlRow>("event_urls", {
        event_id: `eq.${eventRow.id}`,
        select: "event_id,id,link,description",
      }),
      this.client.select<EventImageRow>("event_images", {
        event_id: `eq.${eventRow.id}`,
        select: "event_id,original_url,preview_url,thumbnail_url",
      }),
    ]);

    return {
      eventRow,
      locationRows,
      categoryRows,
      urlRows,
      imageRows,
    };
  }

  public async getDashboardRows() {
    const [dropdownRows, tabRows, cardRows, linkRows] = await Promise.all([
      this.client.select<DropdownRow>("dashboard_dropdowns", {
        select: "id,rank,is_link,translations",
      }),
      this.client.select<TabRow>("dashboard_tabs", {
        select: "id,dropdown_id,sequence,map_url,translations",
      }),
      this.client.select<CardRow>("information_cards", {
        select:
          "id,dashboard_tab_id,sequence,image_url,translations,button_translations,button_open_in_new_tab",
      }),
      this.client.select<LinkRow>("dropdown_links", {
        select: "id,dropdown_id,link,sequence,translations",
      }),
    ]);

    return {
      dropdownRows,
      tabRows,
      cardRows,
      linkRows,
    };
  }

  public getFooterRows(): Promise<FooterRow[]> {
    return this.client.select<FooterRow>("footer_items", {
      select: "id,name,content",
    });
  }

  public getBookingTenantRows(): Promise<BookingTenantRow[]> {
    return this.client.select<BookingTenantRow>("booking_tenants", {
      select: "id,tenant_id",
    });
  }
}
