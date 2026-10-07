import { cleanup, configure } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetCart, resetMarketplace, resetMatches, resetMockUsers, resetOrders, resetPayments, resetReports, resetSupport } from "./mocks/handlers";

/* loaded ci-style runs starve jsdom timers, give queries room */
configure({ asyncUtilTimeout: 8000 });
import { server } from "./mocks/server";

/* every test talks to the mock api, never the real backend */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  /* vitest does not auto-register rtl cleanup without globals mode */
  cleanup();
  server.resetHandlers();
  resetMockUsers();
  resetMarketplace();
  resetCart();
  resetOrders();
  resetPayments();
  resetReports();
  resetMatches();
  resetSupport();
  sessionStorage.clear();
});
afterAll(() => server.close());
