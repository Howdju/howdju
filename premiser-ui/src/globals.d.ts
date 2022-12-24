// Allow the code to import MD files. Babel will actually load them.
declare module "*.md";

declare module "@grrr/cookie-consent";

// Import with a module to prevent turning this file into a module, making
// the declarations above re-declarations.
// See https://github.com/microsoft/TypeScript/issues/28097#issuecomment-489614625
declare module "*.test.tsx" {
  import "jest-extended";
}
