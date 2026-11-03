import { splitThoughts } from "./logic.mjs";
/** Replace this implementation with a server adapter later. Review remains mandatory. */
export const ruleSeparator = {
  name: "규칙 기반 분리",
  async separate(text) {
    return splitThoughts(text);
  },
};
