import { Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { PageFallback } from "@/components/page-fallback";
import {
  AboutPage,
  AccountPage,
  ConfirmEmailPage,
  ContentDetailPage,
  ContentFeedPage,
  FeaturesPage,
  FeedbackPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  MobileAppPage,
  MyAccountPage,
  ProtectedSettings,
  ProtectedStudio,
  ResetPasswordPage,
  SettingsAccountPage,
  SettingsBillingPage,
  SettingsMembershipPage,
  SettingsProfilePage,
  SettingsPublicationsPage,
  SettingsWorksPage,
} from "@/routes/lazy-pages";

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/mobile" element={<MobileAppPage />} />
          <Route path="/content" element={<ContentFeedPage />} />
          <Route path="/content/:slug" element={<ContentDetailPage />} />
          <Route path="/user/:userId" element={<AccountPage />} />
          <Route path="/profile" element={<MyAccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/studio/*" element={<ProtectedStudio />} />
          <Route path="/settings" element={<ProtectedSettings />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<SettingsProfilePage />} />
            <Route path="account" element={<SettingsAccountPage />} />
            <Route path="membership" element={<SettingsMembershipPage />} />
            <Route path="billing" element={<SettingsBillingPage />} />
            <Route path="works" element={<SettingsWorksPage />} />
            <Route path="publications" element={<SettingsPublicationsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
