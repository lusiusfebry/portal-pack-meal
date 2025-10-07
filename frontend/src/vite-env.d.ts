/// <reference types="vite/client" />

/**
 * Explicit env interface to ensure ImportMeta.env is typed,
 * including common Vite flags and custom variables used in this project.
 */
interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;

  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/* Ambient module declarations for vite-plugin-pwa virtual modules to satisfy TypeScript */
declare module 'virtual:pwa-register/react' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onRegisterError?: (error: any) => void;
  }

  export function useRegisterSW(
    options?: RegisterSWOptions
  ): {
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}