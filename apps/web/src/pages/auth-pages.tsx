import { Navigate, Route, Routes } from "react-router-dom";

import { StudioCreateView } from "@/components/studio/studio-create-view";
import { StudioLayout } from "@/components/studio/studio-layout";
import { useIsAuthenticated } from "@/store/auth";

export function ProtectedStudio() {
  const isAuthenticated = useIsAuthenticated();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<StudioLayout />}>
        <Route index element={<StudioCreateView />} />
      </Route>
    </Routes>
  );
}

export { LoginPage } from "@/pages/login-page";
export { ForgotPasswordPage } from "@/pages/forgot-password-page";
export { ResetPasswordPage } from "@/pages/reset-password-page";
