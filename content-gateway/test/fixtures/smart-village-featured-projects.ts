const baseFeaturedProject = {
  genericType: "FeaturedProject",
  visible: true,
  payload: {
    published: true,
    imageCaption: "Bildunterschrift",
    imageCredits: "Stadt Guben",
  },
  contentBlocks: [{ body: "<p>Projektdetails</p>" }],
  mediaContents: [{ sourceUrl: { url: "https://example.com/project.jpg", description: "Projektbild" } }],
};

export const representativeSmartVillageFeaturedProjects = [
  { ...baseFeaturedProject, id: "100", externalId: "513", title: "Energiebericht der Stadt Guben" },
  {
    ...baseFeaturedProject,
    id: "101",
    externalId: "1071",
    title: "Bildungscampus Altstadt Ost",
    payload: { published: true, imageCaption: null, imageCredits: null },
    contentBlocks: [],
    mediaContents: [],
  },
  { ...baseFeaturedProject, id: "102", externalId: "hidden", title: "Versteckt", visible: false },
  { ...baseFeaturedProject, id: "103", externalId: "draft", title: "Entwurf", payload: { published: false } },
  { ...baseFeaturedProject, id: "104", externalId: null, title: "Fehlerhaft" },
] as const;

export const duplicateSmartVillageFeaturedProjects = [
  { ...baseFeaturedProject, id: "200", externalId: "duplicate", title: "Doppelt" },
  { ...baseFeaturedProject, id: "201", externalId: "duplicate", title: "Doppelt" },
] as const;
