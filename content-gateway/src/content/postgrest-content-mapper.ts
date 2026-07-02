import {
  DashboardContent,
  DashboardDropdown,
  Event,
  EventDetailContent,
  MapContent,
  PageHero,
  Project,
  PublicContentHomeCard,
  PublicContentProjectItem,
  dashboardContentSchema,
  dashboardDropdownSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  mapContentSchema,
  pageHeroSchema,
  projectSchema,
} from "../../../shared/public-content/contracts.js";
import { Config } from "../config.js";
import { GatewayError } from "../errors.js";
import {
  buildplaceMapOverviewUrl,
  resolveBuildplaceMapUrl,
} from "./buildplace-map-urls.js";
import {
  CardRow,
  DropdownRow,
  EventCategoryRow,
  EventImageRow,
  EventRow,
  EventUrlRow,
  LinkRow,
  LocationRow,
  PageRow,
  ProjectRow,
  TabRow,
  TranslationRecord,
} from "./postgrest-content-types.js";

const localizedField = (
  translations: TranslationRecord,
  language: string,
  fallbackLanguage: string,
  key: string,
) => {
  const entry = translations[language] ?? translations[fallbackLanguage];
  return entry?.[key];
};

const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GatewayError({
      code: "INVALID_UPSTREAM_PAYLOAD",
      message: `Missing required field: ${field}`,
      statusCode: 502,
      upstream: "postgrest",
      retryable: false,
    });
  }

  return value;
};

const optionalString = (value: unknown): string => (typeof value === "string" ? value : "");

const optionalNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseCoordinates = (value: string | null) => {
  if (!value) {
    return null;
  }

  const [latitudeText, longitudeText] = value.split(";");
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new GatewayError({
      code: "INVALID_UPSTREAM_PAYLOAD",
      message: "Invalid coordinates payload",
      statusCode: 502,
      upstream: "postgrest",
      retryable: false,
    });
  }

  return {
    latitude,
    longitude,
  };
};

const createSeo = (config: Config, path: string, title: string, description: string) => ({
  title: title || "Guben Cockpit",
  description: description || "Oeffentliche Inhalte aus dem Guben Cockpit.",
  canonical: new URL(path, config.PUBLIC_BASE_URL).toString(),
  indexable: true,
});

export const distanceInKm = (
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number => {
  const earthRadiusKm = 6371;
  const dLat = ((latitudeB - latitudeA) * Math.PI) / 180;
  const dLon = ((longitudeB - longitudeA) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((latitudeA * Math.PI) / 180) *
      Math.cos((latitudeB * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export class PostgrestContentMapper {
  public constructor(private readonly config: Config) {}

  public pageFromRow(row: PageRow, language: string): PageHero {
    const title = requiredString(
      localizedField(row.translations, language, this.config.FALLBACK_LANGUAGE, "Title"),
      `${row.id}.title`,
    );
    const description = optionalString(
      localizedField(row.translations, language, this.config.FALLBACK_LANGUAGE, "Description"),
    );

    return pageHeroSchema.parse({
      id: row.id,
      title,
      description,
      seo: createSeo(
        this.config,
        `/${row.id === "Home" ? "" : row.id.toLowerCase()}`,
        title,
        description,
      ),
    });
  }

  public fallbackMapPage(language: string): PageHero {
    const titleByLanguage: Record<string, string> = {
      de: "Karte",
      en: "Map",
      pl: "Mapa",
    };
    const descriptionByLanguage: Record<string, string> = {
      de: "Interaktive Karte aus dem Guben Cockpit.",
      en: "Interactive map from the Guben Cockpit.",
      pl: "Interaktywna mapa z Guben Cockpit.",
    };
    const title =
      titleByLanguage[language] ?? titleByLanguage[this.config.FALLBACK_LANGUAGE] ?? "Karte";
    const description =
      descriptionByLanguage[language] ??
      descriptionByLanguage[this.config.FALLBACK_LANGUAGE] ??
      "Interaktive Karte aus dem Guben Cockpit.";

    return pageHeroSchema.parse({
      id: "Map",
      title,
      description,
      seo: createSeo(this.config, "/map", title, description),
    });
  }

  public projectFromRow(row: ProjectRow, language: string): Project {
    return projectSchema.parse({
      id: row.id,
      type: row.type,
      title: row.title,
      description: optionalString(
        localizedField(row.translations, language, this.config.FALLBACK_LANGUAGE, "Description"),
      ),
      fullText: optionalString(
        localizedField(row.translations, language, this.config.FALLBACK_LANGUAGE, "FullText"),
      ),
      imageCaption: row.image_caption,
      imageUrl: row.image_url,
      imageCredits: row.image_credits,
      published: row.published,
    });
  }

  public publicProjectFromRow(row: ProjectRow, language: string): PublicContentProjectItem {
    const project = this.projectFromRow(row, language);
    const categoryByType: Record<number, PublicContentProjectItem["category"]> = {
      0: "business",
      1: "featured",
      2: "school",
    };
    const category = categoryByType[row.type];

    if (!category) {
      throw new GatewayError({
        code: "INVALID_UPSTREAM_PAYLOAD",
        message: `Unsupported project type: ${row.type}`,
        statusCode: 502,
        upstream: "postgrest",
        retryable: false,
      });
    }

    return {
      ...project,
      category,
    };
  }

  public eventFromRow(
    row: EventRow,
    language: string,
    locations: Map<string, LocationRow>,
    categoriesByEvent: Map<string, EventCategoryRow[]>,
    urlsByEvent: Map<string, EventUrlRow[]>,
    imagesByEvent: Map<string, EventImageRow[]>,
  ): Event {
    const locationRow = locations.get(row.location_id);
    if (!locationRow) {
      throw new GatewayError({
        code: "INVALID_UPSTREAM_PAYLOAD",
        message: `Missing location for event ${row.id}`,
        statusCode: 502,
        upstream: "postgrest",
        retryable: false,
      });
    }

    return eventsContentSchema.shape.events.shape.results.element.parse({
      id: row.id,
      eventId: row.event_id,
      terminId: row.termin_id,
      title: requiredString(
        localizedField(row.translations, language, this.config.FALLBACK_LANGUAGE, "Title"),
        `event.${row.id}.title`,
      ),
      description: requiredString(
        localizedField(row.translations, language, this.config.FALLBACK_LANGUAGE, "Description"),
        `event.${row.id}.description`,
      ),
      startDate: row.start_date,
      endDate: row.end_date,
      location: {
        id: locationRow.id,
        name: requiredString(
          localizedField(
            locationRow.translations,
            language,
            this.config.FALLBACK_LANGUAGE,
            "Name",
          ),
          `location.${locationRow.id}.name`,
        ),
        city: locationRow.city,
        street: locationRow.street,
        telephoneNumber: locationRow.telephone_number,
        fax: locationRow.fax,
        email: locationRow.email,
        website: locationRow.website,
        zip: locationRow.zip,
      },
      coordinates: parseCoordinates(row.coordinates),
      urls: (urlsByEvent.get(row.id) ?? []).map((urlRow) => ({
        link: urlRow.link,
        description: urlRow.description,
      })),
      categories: (categoriesByEvent.get(row.id) ?? []).map((categoryRow) => ({
        id: categoryRow.category_id,
        name: categoryRow.name,
      })),
      images: (imagesByEvent.get(row.id) ?? []).map((imageRow) => ({
        thumbnailUrl: imageRow.thumbnail_url,
        previewUrl: imageRow.preview_url,
        originalUrl: imageRow.original_url,
      })),
      published: row.published,
    });
  }

  public dashboardFromRows(
    language: string,
    rows: {
      dropdownRows: DropdownRow[];
      tabRows: TabRow[];
      cardRows: CardRow[];
      linkRows: LinkRow[];
    },
  ): DashboardContent {
    const cardsByTab = new Map<string, CardRow[]>();
    const linksByDropdown = new Map<string, LinkRow[]>();

    for (const card of rows.cardRows) {
      cardsByTab.set(card.dashboard_tab_id, [...(cardsByTab.get(card.dashboard_tab_id) ?? []), card]);
    }

    for (const link of rows.linkRows) {
      linksByDropdown.set(link.dropdown_id, [...(linksByDropdown.get(link.dropdown_id) ?? []), link]);
    }

    const tabsByDropdown = new Map<string, DashboardDropdown["tabs"]>();
    for (const tabRow of rows.tabRows) {
      if (!tabRow.dropdown_id) {
        continue;
      }

      const localizedTitle = requiredString(
        localizedField(tabRow.translations, language, this.config.FALLBACK_LANGUAGE, "Title"),
        `dashboard_tab.${tabRow.id}.title`,
      );
      const canonicalTitle = requiredString(
        localizedField(
          tabRow.translations,
          this.config.DEFAULT_LANGUAGE,
          this.config.FALLBACK_LANGUAGE,
          "Title",
        ),
        `dashboard_tab.${tabRow.id}.canonical_title`,
      );

      const mappedCards = (cardsByTab.get(tabRow.id) ?? [])
        .sort((left, right) => left.sequence - right.sequence)
        .map((cardRow) => {
          const buttonTitle = optionalNonEmptyString(
            localizedField(
              cardRow.button_translations ?? {},
              language,
              this.config.FALLBACK_LANGUAGE,
              "Title",
            ),
          );
          const buttonUrl = optionalNonEmptyString(
            localizedField(
              cardRow.button_translations ?? {},
              language,
              this.config.FALLBACK_LANGUAGE,
              "Url",
            ),
          );

          return {
            id: cardRow.id,
            title:
              optionalString(
                localizedField(cardRow.translations, language, this.config.FALLBACK_LANGUAGE, "Title"),
              ) || null,
            description:
              optionalString(
                localizedField(
                  cardRow.translations,
                  language,
                  this.config.FALLBACK_LANGUAGE,
                  "Description",
                ),
              ) || null,
            imageUrl: cardRow.image_url,
            imageAlt:
              optionalString(
                localizedField(
                  cardRow.translations,
                  language,
                  this.config.FALLBACK_LANGUAGE,
                  "ImageAlt",
                ),
              ) || null,
            button:
              buttonTitle && buttonUrl
                ? {
                    title: buttonTitle,
                    url: buttonUrl,
                    openInNewTab: cardRow.button_open_in_new_tab ?? false,
                  }
                : null,
          };
        });

      const entry = tabsByDropdown.get(tabRow.dropdown_id) ?? [];
      entry.push(
        dashboardDropdownSchema.shape.tabs.element.parse({
          id: tabRow.id,
          title: localizedTitle,
          sequence: tabRow.sequence,
          mapUrl: resolveBuildplaceMapUrl(canonicalTitle, tabRow.map_url),
          informationCards: mappedCards,
        }),
      );
      tabsByDropdown.set(tabRow.dropdown_id, entry);
    }

    const dropdowns = rows.dropdownRows
      .sort((left, right) => left.rank - right.rank)
      .map((row) =>
        dashboardDropdownSchema.parse({
          id: row.id,
          title: requiredString(
            localizedField(row.translations, language, this.config.FALLBACK_LANGUAGE, "Title"),
            `dashboard_dropdown.${row.id}.title`,
          ),
          rank: row.rank,
          isLink: row.is_link,
          tabs: (tabsByDropdown.get(row.id) ?? []).sort((left, right) => left.sequence - right.sequence),
          links: (linksByDropdown.get(row.id) ?? [])
            .sort((left, right) => left.sequence - right.sequence)
            .map((linkRow) => ({
              id: linkRow.id,
              title: requiredString(
                localizedField(
                  linkRow.translations,
                  language,
                  this.config.FALLBACK_LANGUAGE,
                  "Title",
                ),
                `dropdown_link.${linkRow.id}.title`,
              ),
              link: linkRow.link,
              sequence: linkRow.sequence,
            })),
        }),
      );

    return dashboardContentSchema.parse({
      dropdowns,
      seo: createSeo(
        this.config,
        "/",
        "Dashboard",
        "Thematische Uebersicht der oeffentlichen Inhalte.",
      ),
    });
  }

  public mapContent(language: string, pageRow: PageRow | undefined): MapContent {
    const page = pageRow ? this.pageFromRow(pageRow, language) : this.fallbackMapPage(language);
    return mapContentSchema.parse({
      page,
      map: {
        embedUrl: buildplaceMapOverviewUrl,
      },
      seo: page.seo,
    });
  }

  public eventDetailFromEvent(id: string, event: Event): EventDetailContent {
    return eventDetailContentSchema.parse({
      event,
      seo: createSeo(this.config, `/events/${id}`, event.title, event.description),
    });
  }

  public flattenedHomeCards(dropdowns: DashboardContent["dropdowns"]): PublicContentHomeCard[] {
    return dropdowns.flatMap((dropdown) =>
      dropdown.tabs.flatMap((tab) =>
        tab.informationCards.map((card, cardIndex) => ({
          id: card.id,
          dropdownId: dropdown.id,
          dropdownTitle: dropdown.title,
          tabId: tab.id,
          tabTitle: tab.title,
          sequence: cardIndex + 1,
          title: card.title,
          description: card.description,
          imageUrl: card.imageUrl,
          imageAlt: card.imageAlt,
          button: card.button,
        })),
      ),
    );
  }
}
