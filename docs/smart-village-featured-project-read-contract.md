# Smart Village Featured Project read contract

## Source

The public Cockpit reads Featured Projects server-side through the existing Smart Village OAuth client. The authoritative list query is:

```graphql
genericItems(genericType: "FeaturedProject", order: id_ASC)
```

The detail query uses the same type plus `externalId`. Browser clients only call the content gateway and never receive Smart Village credentials.

## Verified live shape

The live schema provides `id`, `externalId`, `title`, `genericType`, `visible`, `payload`, `contentBlocks`, and `mediaContents`. The verified payload uses `published`, `imageCaption`, and `imageCredits`. The source exposes one text per item and has no language argument or language marker for this GenericItem type.

The public mapping is:

| Public Project field | Smart Village source |
| --- | --- |
| `id` | `externalId` |
| `type` | constant `1` |
| `title` | `title` |
| `description` | empty string |
| `fullText` | first `contentBlocks.body` |
| `imageUrl` | first valid HTTP(S) `mediaContents.sourceUrl.url` |
| `imageCaption` | `payload.imageCaption` |
| `imageCredits` | `payload.imageCredits` |
| `published` | `payload.published` |

Only items with `visible: true` and `payload.published: true` are public. The unmodified Mainserver text is used for German, English, and Polish.

## Identity and failure behavior

`externalId` remains the browser-facing identifier, preserving existing `/projects/:projectId` links. Duplicate public `externalId` values are invalid upstream state: list and ambiguous detail reads fail rather than selecting or deduplicating a record.

Malformed individual records are skipped with a safe warning. A missing collection, GraphQL failure, or duplicate identity fails the Featured Project section. PostgREST remains responsible for Projects page metadata and SEO but is never used as Featured Project content fallback.

## Operational follow-up

The live API currently contains duplicate visible and published records for existing `externalId` values. Their manual cleanup happens in the Mainserver and is tracked outside this implementation; the Cockpit does not reconcile them automatically.
