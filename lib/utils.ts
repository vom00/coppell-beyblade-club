import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn's class merger, used by the RareUI and Ruixen components in components/ui. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
