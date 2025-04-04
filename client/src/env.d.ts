/// <reference types="vite/client" />

declare module 'vite' {
  import { UserConfig } from 'vite';
  export function defineConfig(config: UserConfig): UserConfig;
}

declare module '@vitejs/plugin-react' {
  import { Plugin } from 'vite';
  export default function react(options?: any): Plugin;
} 