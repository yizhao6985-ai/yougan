import { Navigate } from "react-router-dom";

import { SettingsLayout } from "@/pages/settings/settings-layout";
import { useIsAuthenticated } from "@/store/auth";

export function ProtectedSettings() {
  const isAuthenticated = useIsAuthenticated();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <SettingsLayout />;
}
