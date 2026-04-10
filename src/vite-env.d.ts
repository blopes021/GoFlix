/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONETAG_DIRECT_LINK: string;
  readonly VITE_MONETAG_TAG_ID: string;
  // add more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
