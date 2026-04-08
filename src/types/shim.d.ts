// Shim for playwright types - playwright is a peer dependency
export const chromium = () => ({});
export const firefox = () => ({});
export const webkit = () => ({});

export type Browser = any;
export type Page = any;
export type BrowserContext = any;
export type ElementHandle = any;
export type ConsoleMessage = any;
export type Dialog = any;
export type Request = any;
