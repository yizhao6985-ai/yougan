import { Suspense } from "react";
import { Navigate } from "react-router-dom";

import { PageFallback } from "@/components/page-fallback";
import { lazyNamed } from "@/lib/lazy-route";
import { useIsAuthenticated } from "@/store/auth";

const SettingsLayout = lazyNamed(
  () => import("@/pages/settings/settings-layout"),
  "SettingsLayout",
);

export function ProtectedSettings() {
  const isAuthenticated = useIsAuthenticated();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<PageFallback />}>
      <SettingsLayout />
    </Suspense>
  );
}
