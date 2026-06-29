type LocationLike = {
  name?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
};

const normalizePart = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const formatEventLocation = (location: LocationLike) => {
  const name = normalizePart(location.name);
  const street = normalizePart(location.street);
  const zip = normalizePart(location.zip);
  const city = normalizePart(location.city);
  const cityLine = [zip, city].filter(Boolean).join(" ");
  const addressLine = [street, cityLine || null].filter(Boolean).join(", ");

  if (addressLine && name && name !== addressLine) {
    return `${addressLine} (${name})`;
  }

  return addressLine || name || "";
};
