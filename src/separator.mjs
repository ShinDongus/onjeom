import { splitThought } from "./logic.mjs";
/** Original Korean heuristic parser; replace with a consented backend adapter later. */
export const ruleSeparator = {
  name: "규칙 기반 분리",
  async separate(text) {
    return splitThought(text);
  },
};
