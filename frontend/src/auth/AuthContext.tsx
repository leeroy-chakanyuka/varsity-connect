import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, login as loginApi, type AuthUser } from "../api/auth";
import { TOKEN_KEY, UNAUTHORIZED_EVENT } from "../api/client";

interface AuthValue {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/* single hook for session state, throws outside the provider so misuse is loud */
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  /* token lives in session state, a refresh keeps you logged in per tab */
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    /* drop every cached query, none of it belongs to a logged-out screen */
    queryClient.clear();
    navigate("/login");
  }, [navigate, queryClient]);

  /* a stale token resolves itself, no prompt needed */
  useEffect(() => {
    if (token && meQuery.isError) {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      queryClient.clear();
    }
  }, [token, meQuery.isError, queryClient]);

  /* axios tells us when the server rejects the session mid-use */
  useEffect(() => {
    const onUnauthorized = () => {
      if (sessionStorage.getItem(TOKEN_KEY) ?? token) {
        logout();
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout, token]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await loginApi(identifier, password);
      sessionStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      queryClient.setQueryData(["auth", "me"], response.user);
      return response.user;
    },
    [queryClient],
  );

  /* guards wait on this, so protected routes never flash before we know */
  const ready = !token || meQuery.isFetched;

  const value = useMemo<AuthValue>(
    () => ({
      user: (meQuery.data as AuthUser | undefined) ?? null,
      token,
      ready,
      login,
      logout,
    }),
    [meQuery.data, token, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
