import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProtectedStudio,
} from "@/pages/auth-pages";
import { ConfirmEmailPage } from "@/pages/confirm-email-page";
import { ContentDetailPage } from "@/pages/content/content-detail-page";
import { ContentFeedPage } from "@/pages/content/content-feed-page";
import { AboutPage } from "@/pages/about-page";
import { FeedbackPage } from "@/pages/feedback-page";
import { FeaturesPage } from "@/pages/features-page";
import { HomePage } from "@/pages/home-page";
import { MobileAppPage } from "@/pages/mobile-app-page";
import { ProtectedSettings } from "@/pages/settings-pages";
import { SettingsIntegrationsPage } from "@/pages/settings/settings-integrations-page";
import { SettingsBillingPage } from "@/pages/settings/settings-billing-page";
import { SettingsMembershipPage } from "@/pages/settings/settings-membership-page";
import { SettingsPublicationsPage } from "@/pages/settings/settings-publications-page";
import { SettingsAccountPage } from "@/pages/settings/settings-account-page";
import { SettingsProfilePage } from "@/pages/settings/settings-profile-page";
import { SettingsWorksPage } from "@/pages/settings/settings-works-page";
import { MyProfilePage, UserProfilePage } from "@/pages/user/user-profile-page";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/mobile" element={<MobileAppPage />} />
        <Route path="/content" element={<ContentFeedPage />} />
        <Route path="/content/:slug" element={<ContentDetailPage />} />
        <Route path="/user/:userId" element={<UserProfilePage />} />
        <Route path="/profile" element={<MyProfilePage />} />
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
          <Route path="integrations" element={<SettingsIntegrationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
