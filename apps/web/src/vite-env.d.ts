/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LANGGRAPH_API_URL?: string;
  readonly VITE_MOBILE_DOWNLOAD_URL?: string;
  readonly VITE_MOBILE_IOS_DOWNLOAD_URL?: string;
  readonly VITE_MOBILE_ANDROID_DOWNLOAD_URL?: string;
  readonly VITE_FEEDBACK_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
