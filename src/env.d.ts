/// <reference types="vite/client" />

declare module '*.hbs' {
  const content: string;
  export default content;
}

declare module '*.handlebars' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
