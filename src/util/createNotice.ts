import { Notice } from "obsidian";

export const createNotice = (
  message: string | DocumentFragment,
  duration?: number
): Notice => new Notice(typeof message === "string" ? `N-brace: ${message}` : message, duration);
