import { handleOrganize } from "../lib/organizer.mjs";

export const POST = (request) => handleOrganize(request);
export const OPTIONS = (request) => handleOrganize(request);
