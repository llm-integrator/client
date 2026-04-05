/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for root API: same-origin path in dev (e.g. `/api`) or full origin in prod. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
