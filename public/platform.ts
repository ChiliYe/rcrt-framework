import { invoke, isTauri } from "@tauri-apps/api/core";

export interface PlatformApi {
  greet(name: string): Promise<string>;
}

const browserImplementation: PlatformApi = {
  async greet(name) {
    return `Hello, ${name}! You've been greeted from TypeScript in the browser!`;
  },
};

const tauriImplementation: PlatformApi = {
  async greet(name) {
    return invoke<string>("greet", { name });
  },
};

export const platform: PlatformApi = isTauri()
  ? tauriImplementation
  : browserImplementation;