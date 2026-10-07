import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

/* every provider lives here so main.tsx stays thin */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}
