declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
  }
  
declare module '*.hbs' {
    const content: string;
    export default content;
  }