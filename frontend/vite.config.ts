import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from "path"
import svgr from "vite-plugin-svgr"

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [TanStackRouterVite({}), react(), svgr()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("@tiptap") || id.includes("react-markdown") || id.includes("rehype-raw") || id.includes("remark-gfm")) {
            return "rich-content";
          }

          if (id.includes("@radix-ui") || id.includes("@headlessui") || id.includes("lucide-react")) {
            return "ui-vendor";
          }

          if (id.includes("@dnd-kit")) {
            return "drag-drop";
          }

          if (id.includes("i18next")) {
            return "i18n";
          }

          if (id.includes("swiper") || id.includes("embla-carousel")) {
            return "carousels";
          }

          if (id.includes("proj4")) {
            return "mapping";
          }

          if (id.includes("react-hook-form") || id.includes("@hookform/resolvers") || id.includes("zod")) {
            return "forms";
          }

          if (id.includes("@tanstack")) {
            return "tanstack";
          }
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@\/builder\/BuilderPreviewEntry$/,
        replacement: command === "serve"
          ? path.resolve(__dirname, "./src/builder/BuilderPreviewEntry.tsx")
          : path.resolve(__dirname, "./src/builder/BuilderPreviewDisabled.tsx"),
      },
      {
        find: "@shared",
        replacement: path.resolve(__dirname, "../shared"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
}))
