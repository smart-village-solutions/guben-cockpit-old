export type SmartVillageOAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type SmartVillageGraphQLError = {
  message: string;
};

export type SmartVillageGraphQLResponse<T> = {
  data?: T | null;
  errors?: SmartVillageGraphQLError[];
};

export type SmartVillageGeoLocation = {
  latitude: number | null;
  longitude: number | null;
} | null;

export type SmartVillageEventOccurrence = {
  dateStart: string | null;
  dateEnd: string | null;
  timeStart: string | null;
  timeEnd: string | null;
  timeDescription?: string | null;
  weekday?: string | null;
  useOnlyTimeDescription?: string | boolean | null;
};

export type SmartVillageAddress = {
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  geoLocation?: SmartVillageGeoLocation;
};

export type SmartVillageLocation = {
  id?: string | null;
  name?: string | null;
  geoLocation?: SmartVillageGeoLocation;
} | null;

export type SmartVillageCategory = {
  id?: string | null;
  name?: string | null;
};

export type SmartVillageUrl = {
  description?: string | null;
  url?: string | null;
};

export type SmartVillageContact = {
  email?: string | null;
  phone?: string | null;
  webUrls?: SmartVillageUrl[] | null;
};

export type SmartVillagePrice = {
  name?: string | null;
  description?: string | null;
  amount?: number | null;
};

export type SmartVillageMediaContent = {
  sourceUrl?: {
    url?: string | null;
    description?: string | null;
  } | null;
};

export type SmartVillageEventRecord = {
  id?: string | null;
  externalId?: string | null;
  title?: string | null;
  description?: string | null;
  visible?: boolean | null;
  registrationRequired?: boolean | null;
  maximumAttendees?: number | null;
  categories?: SmartVillageCategory[] | null;
  addresses?: SmartVillageAddress[] | null;
  location?: SmartVillageLocation;
  date?: SmartVillageEventOccurrence | null;
  dates?: SmartVillageEventOccurrence[] | null;
  urls?: SmartVillageUrl[] | null;
  mediaContents?: SmartVillageMediaContent[] | null;
  contacts?: SmartVillageContact[] | null;
  organizer?: { name?: string | null } | null;
  priceInformations?: SmartVillagePrice[] | null;
  dataProvider?: { name?: string | null } | null;
};

export type SmartVillageGenericItem = {
  id?: string | null;
  externalId?: string | null;
  title?: string | null;
  genericType?: string | null;
  visible?: boolean | null;
  payload?: unknown;
  contentBlocks?: Array<{ body?: string | null }> | null;
  mediaContents?: SmartVillageMediaContent[] | null;
  webUrls?: SmartVillageUrl[] | null;
  categories?: SmartVillageCategory[] | null;
};
