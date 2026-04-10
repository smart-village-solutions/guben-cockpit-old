/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILDER_PUBLIC_API_KEY?: string;
  readonly VITE_BUILDER_MODEL?: string;
  readonly VITE_BUILDER_PREVIEW_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
