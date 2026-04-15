import { z } from "zod";

const nullableString = z.string().nullable().optional();

export const bookingLocationSchema = z.object({
  display_address: z.string().optional().default(""),
});

export const bookingPriceCategorySchema = z.object({
  priceEur: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  external: z.boolean().nullable().optional(),
});

export const bookingAttachmentSchema = z.object({
  id: z.string(),
  title: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  type: z.string().optional().default(""),
  // Live payloads use empty strings for optional attachments.
  url: z.string().optional().default(""),
  show: z.boolean().optional(),
  required: z.boolean().optional(),
  mailAttach: z.boolean().optional(),
});

export const bookingExternalProviderSchema = z.object({
  active: z.boolean().optional().default(false),
  provider: z.string().optional().default(""),
});

export const publicBookableSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().optional().default(""),
  imgUrl: z.string().optional().default(""),
  flags: z.array(z.string()).optional().default([]),
  bookingNotes: z.string().optional().default(""),
  autoCommitBooking: z.boolean().optional().default(false),
  location: bookingLocationSchema.optional().default({ display_address: "" }),
  priceCategories: z.array(bookingPriceCategorySchema).optional().default([]),
  requiresLogin: z.boolean().optional().default(false),
  attachments: z.array(bookingAttachmentSchema).optional().default([]),
  externalProviders: z.array(bookingExternalProviderSchema).optional().default([]),
  isBookable: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(true),
  amount: z.number().nullable().optional(),
  minBookingDuration: z.number().nullable().optional(),
  maxBookingDuration: z.number().nullable().optional(),
  eventId: nullableString,
});

export const publicBookablesSchema = z.array(publicBookableSchema);

export const occupancySchema = z.object({
  bookableId: z.string(),
  title: z.string(),
  isAvailable: z.boolean(),
  totalCapacity: z.number().nullable().optional(),
  booked: z.number().nullable().optional(),
  remaining: z.number().nullable().optional(),
});

export type BookingApiBookable = z.infer<typeof publicBookableSchema>;
export type BookingApiOccupancy = z.infer<typeof occupancySchema>;
