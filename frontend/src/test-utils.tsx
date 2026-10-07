import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { TOKEN_KEY } from "./api/client";

/* fresh query client per test so sessions never leak between cases */
export function renderWithSession(ui: ReactElement, route = "/", token?: string) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
