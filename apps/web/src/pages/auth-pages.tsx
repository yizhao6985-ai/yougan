import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { PageFallback } from "@/components/page-fallback";
import { lazyNamed } from "@/lib/lazy-route";
import { useIsAuthenticated } from "@/store/auth";

const StudioLayout = lazyNamed(
  () => import("@/components/studio/studio-layout"),
  "StudioLayout",
);
const StudioCreateView = lazyNamed(
  () => import("@/components/studio/studio-create-view"),
  "StudioCreateView",
);

export function ProtectedStudio() {
  const isAuthenticated = useIsAuthenticated();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<StudioLayout />}>
          <Route index element={<StudioCreateView />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
