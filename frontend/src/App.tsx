import { Router } from "./app/router";
import { Providers } from "./app/providers";

/* root stays thin, shell + router own the layout */
export default function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  );
}
