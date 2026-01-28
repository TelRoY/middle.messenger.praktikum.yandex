/// <reference types="vite/client" />
import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

// Функция для загрузки partials
const loadPartials = (partialsDir: string) => {
  const partials: Record<string, string> = {};

  const registerPartial = (name: string, content: string) => {
    try {
      // Проверяем синтаксис перед регистрацией
      Handlebars.compile(content);
      partials[name] = content;
      Handlebars.registerPartial(name, content);
    } catch (error: any) {
      console.error(`✗ Ошибка в partial ${name}:`, (error as Error).message);
    }
  };

  const readPartialsRecursive = (dir: string, prefix = "") => {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    items.forEach((item) => {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        readPartialsRecursive(fullPath, `${prefix}${item.name}/`);
      } else if (item.name.endsWith(".hbs")) {
        const name = item.name.replace(".hbs", "");
        const partialName = `${prefix}${name}`;
        const content = fs.readFileSync(fullPath, "utf-8");
        registerPartial(partialName, content);
      }
    });
  };

  readPartialsRecursive(partialsDir);
  return partials;
};

// Интерфейс для контекста Handlebars
interface PageContext {
  [key: string]: any;
}

// Интерфейс для опций плагина
interface HandlebarsPluginOptions {
  partialsDir?: string;
  context?: PageContext;
}

// Кастомный плагин Handlebars
const createHandlebarsPlugin = (options: HandlebarsPluginOptions = {}) => {
  const partialsDir = options.partialsDir || "src/components";
  const context = options.context || {};

  // Загружаем partials
  loadPartials(resolve(partialsDir));

  // Регистрируем хелперы
  Handlebars.registerHelper("json", function (context) {
    return JSON.stringify(context);
  });

  Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  return {
    name: "handlebars",

    transformIndexHtml: {
      order: "pre",
      handler(html: string, ctx: { filename?: string }) {
        const filename = ctx.filename || "unknown";

        try {
          // Создаем контекст для страницы
          const pageContext = {
            ...context,
            pageName: path.basename(filename, ".html"),
            menuItems: [
              { title: "Авторизация", url: "/src/pages/authorization/authorization.html" },
              { title: "Регистрация", url: "/src/pages/registration/registration.html" },
              { title: "Главная", url: "/src/pages/home/home.html" },
              { title: "Профиль", url: "/src/pages/profile/profile.html" },
              { title: "404", url: "/src/pages/404/404.html" },
              { title: "500", url: "/src/pages/500/500.html" },
            ],
          };

          // Компилируем
          const template = Handlebars.compile(html, {
            noEscape: true,
            strict: true,
          });

          const result = template(pageContext);
          return result;
        } catch (error: any) {
          console.error((error as Error).message);
          const safeHtml = html
            .replace(/\{\{[\s\S]*?\}\}/g, "") // Удаляем все {{...}}
            .replace(/\{\{#[\s\S]*?\}\}/g, "") // Удаляем все {{#...}}
            .replace(/\{\{\/[\s\S]*?\}\}/g, "") // Удаляем все {{/...}}
            .replace(/\{\{>[\s\S]*?\}\}/g, ""); // Удаляем все {{>...}}
          return safeHtml;
        }
      },
    },
  };
};

export default defineConfig({
  root: __dirname,
  base: "./",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        authorization: resolve(__dirname, "src/pages/authorization/authorization.html"),
        registration: resolve(__dirname, "src/pages/registration/registration.html"),
        home: resolve(__dirname, "src/pages/home/home.html"),
        profile: resolve(__dirname, "src/pages/profile/profile.html"),
        error404: resolve(__dirname, "src/pages/404/404.html"),
        error500: resolve(__dirname, "src/pages/500/500.html"),
      },
    },
  },

  server: {
    port: 3000,
    open: true,
    host: "localhost",
  },

  preview: {
    port: 3000,
    open: true,
  },

  css: {
    postcss: "postcss.config.js",
  },

  plugins: [
    createHandlebarsPlugin({
      partialsDir: "src/components",
      context: {
        title: "MyMate",
      },
    }) as PluginOption,
  ],
});