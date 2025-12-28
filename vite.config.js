// import { partial } from "lodash-es";
import { resolve } from "path";
import { defineConfig } from "vite";
// import handlebars from "vite-plugin-handlebars";

export default defineConfig({
  root: resolve(__dirname),
  build: {
    outDir: "MyMate/dist",
    emptyOutDir: true,
  },
  // resolve: {
  //   alias: {
  //     "@": "/src",
  //     "@components": "src/components",
  //   },
  // },
  server: { port: 3000 },
  // plugins: [
  //   handlebars({
  //     partialDirectory: resolve(__dirname, "src/layouts"),
  //     context: {
  //       title: "MyMate",
  //       currentYear: new Date().getFullYear(),
  //     },
  //   }),
  // ],
  css: {
    postcss: "postcss.config.js",
  },
});
