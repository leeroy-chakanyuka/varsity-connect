import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/* node-side mock server for vitest, mirrors the real auth contract */
export const server = setupServer(...handlers);
