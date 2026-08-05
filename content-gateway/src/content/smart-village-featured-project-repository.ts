import {
  featuredProjectDetailContentSchema,
  type FeaturedProjectDetailContent,
  type Project,
} from "../../../shared/public-content/contracts.js";
import { GatewayError } from "../errors.js";
import { requestCached, type SmartVillageGraphQLReader } from "../upstream/smart-village-graphql-client.js";
import type { SmartVillageGenericItem } from "../upstream/smart-village-types.js";

const FEATURED_PROJECT_FIELDS = `
  id
  externalId
  title
  genericType
  visible
  payload
  contentBlocks { body }
  mediaContents { sourceUrl { url description } }
`;

export const FEATURED_PROJECTS_QUERY = `
  query SmartVillageFeaturedProjects {
    genericItems(genericType: "FeaturedProject", order: id_ASC) {
      ${FEATURED_PROJECT_FIELDS}
    }
  }
`;

export const FEATURED_PROJECT_DETAIL_QUERY = `
  query SmartVillageFeaturedProject($externalId: ID!) {
    genericItems(genericType: "FeaturedProject", externalId: $externalId, order: id_ASC) {
      ${FEATURED_PROJECT_FIELDS}
    }
  }
`;

type Options = {
  client: SmartVillageGraphQLReader;
  publicBaseUrl: string;
  warn?: (message: string, context: Record<string, unknown>) => void;
};

type FeaturedProjectPayload = {
  published: boolean;
  imageCaption: string | null;
  imageCredits: string | null;
};

const nonEmpty = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const optionalString = (value: unknown) => nonEmpty(value);

const httpUrl = (value: unknown) => {
  const candidate = nonEmpty(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const parsePayload = (value: unknown): FeaturedProjectPayload | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  if (typeof payload.published !== "boolean") return null;
  return {
    published: payload.published,
    imageCaption: optionalString(payload.imageCaption),
    imageCredits: optionalString(payload.imageCredits),
  };
};

const invalidCollectionError = (message = "Smart Village Featured Project response did not contain a valid genericItems collection") =>
  new GatewayError({
    code: "INVALID_UPSTREAM_PAYLOAD",
    message,
    statusCode: 502,
    upstream: "smartvillage",
    retryable: false,
  });

const notFoundError = () => new GatewayError({
  code: "NOT_FOUND",
  message: "Requested Featured Project was not found",
  statusCode: 404,
  upstream: "gateway",
  retryable: false,
});

export const toPublicFeaturedProjectId = (id: string) => `featured:${encodeURIComponent(id)}`;

export const fromPublicFeaturedProjectId = (id: string) => {
  if (!id.startsWith("featured:")) return null;
  try {
    const decoded = decodeURIComponent(id.slice("featured:".length));
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
};

export class SmartVillageFeaturedProjectRepository {
  public constructor(private readonly options: Options) {}

  public async getFeaturedProjects(language: string): Promise<Project[]> {
    void language;
    const response = await requestCached(this.options.client, {
      contractId: "featured-projects.collection.v1",
      query: FEATURED_PROJECTS_QUERY,
      validate: (value: { genericItems?: SmartVillageGenericItem[] | null }) => {
        this.validateCollection(value);
      },
    });
    if (!Array.isArray(response.genericItems)) throw invalidCollectionError();
    return response.genericItems.flatMap((item) => this.mapItemOrWarn(item));
  }

  public async getFeaturedProjectById(language: string, publicId: string): Promise<FeaturedProjectDetailContent> {
    void language;
    const normalizedId = nonEmpty(publicId);
    if (!normalizedId) throw notFoundError();
    const internalId = fromPublicFeaturedProjectId(normalizedId);
    if (normalizedId.startsWith("featured:")) {
      if (!internalId) throw notFoundError();
      const response = await requestCached(this.options.client, {
        contractId: "featured-projects.collection.v1",
        query: FEATURED_PROJECTS_QUERY,
        validate: (value: { genericItems?: SmartVillageGenericItem[] | null }) => {
          this.validateCollection(value);
        },
      });
      if (!Array.isArray(response.genericItems)) throw invalidCollectionError();
      const matches = response.genericItems.filter((item) => nonEmpty(item.id) === internalId).flatMap((item) => this.mapItemOrWarn(item));
      if (matches.length === 0) throw notFoundError();
      if (matches.length > 1) throw invalidCollectionError(`Smart Village returned duplicate Featured Projects for id ${internalId}`);
      return this.toDetailContent(matches[0]!, normalizedId);
    }
    const response = await requestCached(this.options.client, {
      contractId: "featured-projects.detail.v1",
      query: FEATURED_PROJECT_DETAIL_QUERY,
      variables: { externalId: normalizedId },
      validate: (value: { genericItems?: SmartVillageGenericItem[] | null }) => {
        this.validateCollection(value, normalizedId);
      },
    });
    if (!Array.isArray(response.genericItems)) throw invalidCollectionError();
    const projects = response.genericItems.flatMap((item) => this.mapItemOrWarn(item));
    if (projects.length === 0) throw notFoundError();
    if (projects.length > 1) throw invalidCollectionError(`Smart Village returned duplicate Featured Projects for externalId ${normalizedId}`);
    return this.toDetailContent(projects[0]!, normalizedId);
  }

  private toDetailContent(project: Project, canonicalId: string): FeaturedProjectDetailContent {
    return featuredProjectDetailContentSchema.parse({
      project,
      seo: {
        title: project.title,
        description: project.description || project.title,
        canonical: new URL(`/projects/${encodeURIComponent(canonicalId)}`, this.options.publicBaseUrl).toString(),
        indexable: true,
      },
    });
  }

  private mapItemOrWarn(item: SmartVillageGenericItem): Project[] {
    const mapped = this.mapItem(item);
    if (mapped) return [mapped];
    this.options.warn?.("Skipping malformed or non-public Smart Village Featured Project", {
      id: nonEmpty(item.id),
      externalId: nonEmpty(item.externalId),
      title: nonEmpty(item.title),
      genericType: nonEmpty(item.genericType),
      visible: item.visible ?? null,
    });
    return [];
  }

  private mapItem(item: SmartVillageGenericItem): Project | null {
    const internalId = nonEmpty(item.id);
    const title = nonEmpty(item.title);
    const payload = parsePayload(item.payload);
    if (!internalId || !title || item.genericType !== "FeaturedProject" || item.visible !== true || !payload?.published) return null;
    const imageUrl = (item.mediaContents ?? []).map((media) => httpUrl(media.sourceUrl?.url)).find(Boolean) ?? null;
    return {
      id: toPublicFeaturedProjectId(internalId),
      type: 1,
      title,
      description: "",
      fullText: optionalString(item.contentBlocks?.[0]?.body) ?? "",
      imageCaption: payload.imageCaption,
      imageUrl,
      imageCredits: payload.imageCredits,
      published: true,
    };
  }

  private validateCollection(
    response: { genericItems?: SmartVillageGenericItem[] | null },
    expectedExternalId?: string,
  ) {
    if (!Array.isArray(response.genericItems)) throw invalidCollectionError();
    if (expectedExternalId) {
      const projects = response.genericItems.flatMap((item) => {
        const mapped = this.mapItem(item);
        return mapped ? [mapped] : [];
      });
      if (projects.length <= 1) return;
      throw invalidCollectionError(`Smart Village returned duplicate Featured Projects for externalId ${expectedExternalId}`);
    }
  }
}
