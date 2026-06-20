import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 12);

/** Prefixed, URL-safe id, e.g. `sub_3f9a...`. */
export function newId(prefix: string): string {
  return `${prefix}_${nano()}`;
}
