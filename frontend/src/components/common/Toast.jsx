import { toast as sonnerToast } from "sonner";

// Thin wrapper around sonner so the rest of the app imports a single toast helper.
export const toast = {
  success: (msg, description) =>
    sonnerToast.success(msg, { description }),

  error: (msg, description) =>
    sonnerToast.error(msg, { description }),

  info: (msg, description) =>
    sonnerToast(msg, { description }),
};