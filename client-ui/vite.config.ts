import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueI18n from "@intlify/vite-plugin-vue-i18n";
import * as path from "path";
import { createHash } from 'crypto'
import tsconfigPaths from "vite-tsconfig-paths";
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default ({ mode }) => {
  // Load app-level env vars to node-level env vars.
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  // https://vitejs.dev/config/
  return defineConfig({
    // To access env vars here use process.env.TEST_VAR
    define: {
      "process.env": {},
    },
    
    server: {
      port: 3001,
      host: true,
      strictPort: true,
      // configure vite for HMR with Gitpod
      hmr:  {
        clientPort: 8080,
      },
      
      
    },
   
  });
};
