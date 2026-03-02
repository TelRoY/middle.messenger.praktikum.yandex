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
    // Проверяем синтаксис перед регистрацией
    Handlebars.compile(content);
    partials[name] = content;
    Handlebars.registerPartial(name, content);
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

const handlebarsImportPlugin = {
  name: "handlebars-import",
  
  transform(code: string, id: string) {
    if (id.endsWith('.hbs')) {
      // Преобразуем содержимое .hbs файла в строку
      const content = fs.readFileSync(id, 'utf-8');
      // Экранируем спецсимволы для JavaScript строки
      const escapedContent = content
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\${/g, '\\${');
      
      return {
        code: `export default \`${escapedContent}\`;`,
        map: null
      };
    }
  }
};

// Интерфейс для контекста Handlebars
interface PageContext {
  [key: string]: unknown;
  title?: string;
  pageName?: string;
  menuItems?: Array<{ title: string; url: string }>;
}

// Интерфейс для опций плагина
interface HandlebarsPluginOptions {
  partialsDir?: string;
  context?: PageContext;
}

// Кастомный плагин Handlebars
function createHandlebarsPlugin(options: HandlebarsPluginOptions = {}) {
  const partialsDir = options.partialsDir || "src/components";
  const context = options.context || {};

  // Загружаем partials
  loadPartials(resolve(partialsDir));

  // Регистрируем хелперы
  Handlebars.registerHelper("json", function (context: unknown) {
    return JSON.stringify(context);
  });

  Handlebars.registerHelper("ifEquals", function (this: unknown, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  Handlebars.registerHelper("eq", function (this: unknown, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  return {
    name: "handlebars",

    transformIndexHtml: {
      order: "pre",
      handler(html: string, ctx: { filename?: string; }) {
        const filename = ctx.filename || "unknown";

        try {
          // Создаем контекст для страницы
          const pageContext = {
            ...context,
            pageName: path.basename(filename, ".html"),
            menuItems: [
              { title: "Авторизация", url: "/" },
              { title: "Регистрация", url: "/sign-up" },
              { title: "Главная", url: "/messenger" },
              { title: "Профиль", url: "/settings" },
              { title: "404", url: "/404" },
              { title: "500", url: "/500" },
            ],
          };

          // Компилируем
          const template = Handlebars.compile(html, {
            noEscape: true,
            strict: true,
          });

          const result = template(pageContext);
          return result;
        } catch (error) {
          console.error(error instanceof Error ? error.message : String(error));
          const safeHtml = html
            .replace(/\{\{[\s\S]*?\}\}/g, "") 
            .replace(/\{\{#[\s\S]*?\}\}/g, "") 
            .replace(/\{\{\/[\s\S]*?\}\}/g, "") 
            .replace(/\{\{>[\s\S]*?\}\}/g, "");
          return safeHtml;
        }
      },
    },
  };
}

export default defineConfig({
  root: __dirname,
  base: "./",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
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
    handlebarsImportPlugin,
    createHandlebarsPlugin({
      partialsDir: "src/components",
      context: {
        title: "MyMate",
      },
    }) as PluginOption,
  ],
});
