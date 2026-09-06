/// <reference types="vite/client" />

declare module '*.css' {
  const classes: Record<string, string>
  export default classes
}
