import { cleanup, configure } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { resetCart, resetCommunity, resetMarketplace, resetMatches, resetMockUsers, resetNotifications, resetOrders, resetPayments, resetReports, resetSupport } from "./mocks/handlers";

/* realtime sockets stay silent under test, the socket suite mocks the client */
class SilentWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = 3;
  binaryType = "arraybuffer";
  onopen: ((event: object) => void) | null = null;
  onclose: ((event: object) => void) | null = null;
  onmessage: ((event: object) => void) | null = null;
  onerror: ((event: object) => void) | null = null;
  constructor(public url: string | URL) {}
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}
vi.stubGlobal("WebSocket", SilentWebSocket);

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
  resetCommunity();
  resetNotifications();
  sessionStorage.clear();
});
afterAll(() => server.close());
