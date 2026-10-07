import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Shell } from "../components/shell";
import { DashboardPage } from "../pages/DashboardPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { CreateListingPage } from "../pages/CreateListingPage";
import { CreateReportPage } from "../pages/CreateReportPage";
import { EditListingPage } from "../pages/EditListingPage";
import { ListingDetailPage } from "../pages/ListingDetailPage";
import { LoginPage } from "../pages/LoginPage";
import { MarketplacePage } from "../pages/MarketplacePage";
import { LostFoundPage } from "../pages/LostFoundPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { OrdersPage } from "../pages/OrdersPage";
import { PaymentResultPage } from "../pages/PaymentResultPage";
import { ReportDetailPage } from "../pages/ReportDetailPage";
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
        <Route
          path="market"
          element={
            <ProtectedRoute>
              <MarketplacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="market/new"
          element={
            <ProtectedRoute>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="market/:id"
          element={
            <ProtectedRoute>
              <ListingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="market/:id/edit"
          element={
            <ProtectedRoute>
              <EditListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id/result"
          element={
            <ProtectedRoute>
              <PaymentResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lost-found"
          element={
            <ProtectedRoute>
              <LostFoundPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lost-found/new"
          element={
            <ProtectedRoute>
              <CreateReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="lost-found/:id"
          element={
            <ProtectedRoute>
              <ReportDetailPage />
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
