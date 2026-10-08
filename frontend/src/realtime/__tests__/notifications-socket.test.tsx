import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithSession } from "../../test-utils";
import { RealtimeToasts } from "../RealtimeToasts";
import {
  startNotificationsSocket,
  stopNotificationsSocket,
  useNotificationsSocket,
} from "../notifications-socket";
import { resetToasts } from "../toast-store";
import { QueryClient } from "@tanstack/react-query";

interface FakeSubscription {
  dest: string;
  cb: (frame: { body: string }) => void;
}

interface FakeClient {
  config: {
    brokerURL?: string;
    connectHeaders?: Record<string, string>;
    onConnect?: () => void;
  };
  active: boolean;
  subscribed: FakeSubscription[];
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  subscribe: (dest: string, cb: (frame: { body: string }) => void) => { id: string };
}

const instances: FakeClient[] = [];

vi.mock("@stomp/stompjs", () => {
  class FakeClientImpl implements FakeClient {
    config: FakeClient["config"];
    active = false;
    subscribed: FakeSubscription[] = [];

    constructor(config: FakeClient["config"]) {
      this.config = config;
      instances.push(this);
    }

    async activate() {
      this.active = true;
      this.config.onConnect?.();
    }

    async deactivate() {
      this.active = false;
    }

    subscribe(dest: string, cb: (frame: { body: string }) => void) {
      this.subscribed.push({ dest, cb });
      return { id: dest };
    }
  }
  return { Client: FakeClientImpl };
});

function probe() {
  function Probe() {
    useNotificationsSocket();
    return <RealtimeToasts />;
  }
  return renderWithSession(<Probe />, "/dashboard", "student-token");
}

const ping = {
  id: "notif-live-1",
  type: "ORDER_PAID",
  title: "payment successful",
  message: "your order is paid",
  entityType: "order",
  entityId: "order-1",
  readAt: null,
  createdAt: "2026-10-07T12:00:00Z",
};

describe("notifications socket", () => {
  beforeEach(() => {
    stopNotificationsSocket();
    resetToasts();
    instances.length = 0;
  });

  it("connects with the jwt and subscribes to the private queue", async () => {
    probe();

    await waitFor(() => expect(instances.length).toBe(1));
    const only = instances[0];
    expect(only.config.brokerURL).toBe("ws://localhost:8080/ws");
    expect(only.config.connectHeaders).toMatchObject({ Authorization: "Bearer student-token" });
    expect(only.subscribed.map((sub) => sub.dest)).toContain("/user/queue/notifications");
  });

  it("toasts an incoming ping", async () => {
    probe();

    await waitFor(() => expect(instances.length).toBe(1));
    const sub = instances[0].subscribed.find((entry) => entry.dest === "/user/queue/notifications");
    expect(sub).toBeDefined();
    sub?.cb({ body: JSON.stringify(ping) });

    expect(await screen.findByText("payment successful")).toBeInTheDocument();
  });

  it("shares one client across mounts and stops on logout", async () => {
    const first = probe();
    first.unmount();
    probe();

    await waitFor(() => expect(instances.length).toBe(1));

    stopNotificationsSocket();
    expect(instances[0].active).toBe(false);
  });

  it("ignores a malformed frame", async () => {
    probe();

    await waitFor(() => expect(instances.length).toBe(1));
    const sub = instances[0].subscribed.find((entry) => entry.dest === "/user/queue/notifications");
    sub?.cb({ body: "not json at all {{{" });

    /* nothing toasts, socket stays up */
    expect(screen.queryByText("payment successful")).not.toBeInTheDocument();
    expect(instances[0].active).toBe(true);
  });
});

describe("startNotificationsSocket", () => {
  it("restarts when the token changes", () => {
    instances.length = 0;
    stopNotificationsSocket();
    const queryClient = new QueryClient();
    startNotificationsSocket("token-a", queryClient);
    expect(instances.length).toBe(1);
    startNotificationsSocket("token-b", queryClient);

    expect(instances.length).toBe(2);
    expect(instances[0].active).toBe(false);
  });
});
