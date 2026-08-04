# Smart Village POI read contract

Read-only verification date: 2026-08-04

## Dataset

- 315 Points of Interest returned by the authenticated Guben GraphQL endpoint.
- 315 active and 315 visible records; no record had a blank name.
- 285 records expose an `externalId`.
- 289 records have media, 200 have addresses, 163 have usable coordinates, 183 have contact data, 44 have opening hours, 33 have POI web URLs, and 56 have an operating company.
- Five data-provider IDs occur. Provider identity is not used to scope the public POI catalogue.

All active and visible tenant-readable POIs therefore form the public catalogue. The gateway still enforces active/visible/name validation so future editorial changes remain safe.

## Categories

The dataset exposes 47 distinct category IDs. Categories are presented as one flat, ID-keyed multi-select. Equal display names with distinct IDs remain separate options. Parent data is retained in the internal upstream shape but is not used to group the initial filter UI because only one observed category has a parent.

Verified legacy-route mappings:

- `/projects/schools` -> category `6186` (`Schulen`)
- `/projects/marketplace` -> category `6187` (`Unternehmen`, parent `Marktplatz`)

The same records also carry technical duplicate classifiers `6405` (`school`) and `6404` (`business`). They remain ordinary upstream categories; redirects deliberately use the localized editorial categories.

## Location and coordinates

The public location label/value priority is:

1. trimmed `location.name`;
2. otherwise the first nonempty trimmed `addresses[].city`.

Stable filter values are normalized case-insensitively from that label. Coordinates use `location.geoLocation` first and then the first address with a valid `geoLocation`. The radius filter measures from Guben and excludes records without usable coordinates only while a radius is active.

## Legacy detail IDs

The live public content bundle contained 73 local School/Business project IDs (3 schools and 70 businesses). None matched a POI `id` or `externalId`. No legacy detail alias can therefore be introduced safely. The old list routes redirect through their verified category IDs, while unmatched historical detail URLs keep the normal not-found behavior.

## Operational boundary

This verification used GraphQL and public HTTP reads only. It did not perform mutations, activate workflows, delete local content, or expose OAuth credentials/tokens.
