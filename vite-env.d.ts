// Fixed type definitions
// Using namespace augmentation to avoid redeclaring block-scoped variable 'process'

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
