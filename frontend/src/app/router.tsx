import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Shell } from "../components/shell";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { MyProfilePage } from "../pages/MyProfilePage";
import { PublicProfilePage } from "../pages/PublicProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { RoleSelectPage } from "../pages/RoleSelectPage";
import { SplashPage } from "../pages/SplashPage";

/* auth routes are real now, feature routes plug in with their stages */
export function Router() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<SplashPage />} />
        <Route path="welcome" element={<RoleSelectPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <MyProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile/:id"
          element={
            <ProtectedRoute>
              <PublicProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="font-display text-3xl font-semibold lowercase text-cocoa">
        nothing here<span className="text-rosewood">.</span>
      </p>
      <p className="text-sm lowercase text-taupe">that page does not exist</p>
    </section>
  );
}
