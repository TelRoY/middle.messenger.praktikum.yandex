import { resolve } from "path";
import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

// Функция для загрузки partials
const loadPartials = (partialsDir) => {
  const partials = {};

  if (!fs.existsSync(partialsDir)) {
    console.warn(`Папка partials не найдена: ${partialsDir}`);
    return partials;
  }

  const registerPartial = (name, content) => {
    try {
      // Проверяем синтаксис перед регистрацией
      Handlebars.compile(content);
      partials[name] = content;
      Handlebars.registerPartial(name, content);
      console.log(`✓ Загружен partial: ${name}`);
    } catch (error) {
      console.error(`✗ Ошибка в partial ${name}:`, error.message);
    }
  };

  const readPartialsRecursive = (dir, prefix = "") => {
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

// Кастомный плагин Handlebars
const createHandlebarsPlugin = (options = {}) => {
  const partialsDir = options.partialsDir || "src/components";
  const context = options.context || {};

  console.log("Инициализация Handlebars плагина...");
  console.log("Папка partials:", resolve(partialsDir));

  // Загружаем partials
  const partials = loadPartials(resolve(partialsDir));

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
      handler(html, ctx) {
        const filename = ctx.filename || "unknown";
        console.log(`\n=== Обработка файла: ${path.basename(filename)} ===`);

        // Если в HTML уже есть комментарий об ошибке, пропускаем
        if (html.includes("Handlebars Error:")) {
          console.log("Пропускаем - уже содержит ошибку Handlebars");
          return html;
        }

        try {
          // Создаем контекст для страницы
          const pageContext = {
            ...context,
            pageName: path.basename(filename, ".html"),
            menuItems: [
              { title: "Авторизация", url: "./src/pages/authorization/authorization.html" },
              { title: "Регистрация", url: "./src/pages/registration/registration.html" },
              { title: "Главная", url: "./src/pages/home/home.html" },
              { title: "404", url: "./src/pages/404/404.html" },
              { title: "500", url: "./src/pages/500/500.html" },
            ],
          };

          console.log("Контекст:", {
            title: pageContext.title,
            siteName: pageContext.siteName,
            currentYear: pageContext.currentYear,
            hasMenuItems: pageContext.menuItems?.length || 0,
          });

          console.log("Контекст:", pageContext);
          console.log("Доступные partials:", Object.keys(partials));

          // Компилируем
          const template = Handlebars.compile(html, {
            noEscape: true,
            strict: true,
          });

          const result = template(pageContext);
          console.log("✓ Компиляция успешна");
          return result;
        } catch (error) {
          console.error('✗ Ошибка компиляции Handlebars:');
          console.error('Сообщение:', error.message);
          
          // Вместо добавления комментария, просто возвращаем оригинальный HTML
          // но выводим ошибку в консоль
          console.error('Возвращаем оригинальный HTML без обработки');
          
          // Возвращаем чистый HTML без комментариев об ошибках
          // Можно закомментировать Handlebars выражения чтобы страница работала
          const safeHtml = html
            .replace(/\{\{[\s\S]*?\}\}/g, '') // Удаляем все {{...}}
            .replace(/\{\{#[\s\S]*?\}\}/g, '') // Удаляем все {{#...}}
            .replace(/\{\{\/[\s\S]*?\}\}/g, '') // Удаляем все {{/...}}
            .replace(/\{\{>[\s\S]*?\}\}/g, ''); // Удаляем все {{>...}}
          
          return safeHtml;
        }
      }
    }
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
        error404: resolve(__dirname, "src/pages/404/404.html"),
        error500: resolve(__dirname, "src/pages/500/500.html"),
      },
    },
  },

  server: {
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
        siteName: "MyMate",
        currentYear: new Date().getFullYear(),
      },
    }),
  ],
});
