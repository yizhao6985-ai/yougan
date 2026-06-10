import { lazyNamed } from "@/lib/lazy-route";

export const HomePage = lazyNamed(
  () => import("@/pages/home-page"),
  "HomePage",
);
export const AboutPage = lazyNamed(
  () => import("@/pages/about-page"),
  "AboutPage",
);
export const FeedbackPage = lazyNamed(
  () => import("@/pages/feedback-page"),
  "FeedbackPage",
);
export const FeaturesPage = lazyNamed(
  () => import("@/pages/features-page"),
  "FeaturesPage",
);
export const MobileAppPage = lazyNamed(
  () => import("@/pages/mobile-app-page"),
  "MobileAppPage",
);
export const ContentFeedPage = lazyNamed(
  () => import("@/pages/content/content-feed-page"),
  "ContentFeedPage",
);
export const ContentDetailPage = lazyNamed(
  () => import("@/pages/content/content-detail-page"),
  "ContentDetailPage",
);
export const AccountPage = lazyNamed(
  () => import("@/pages/user/account-page"),
  "AccountPage",
);
export const MyAccountPage = lazyNamed(
  () => import("@/pages/user/account-page"),
  "MyAccountPage",
);
export const LoginPage = lazyNamed(
  () => import("@/pages/login-page"),
  "LoginPage",
);
export const ForgotPasswordPage = lazyNamed(
  () => import("@/pages/forgot-password-page"),
  "ForgotPasswordPage",
);
export const ResetPasswordPage = lazyNamed(
  () => import("@/pages/reset-password-page"),
  "ResetPasswordPage",
);
export const ConfirmEmailPage = lazyNamed(
  () => import("@/pages/confirm-email-page"),
  "ConfirmEmailPage",
);
export const ProtectedStudio = lazyNamed(
  () => import("@/pages/auth-pages"),
  "ProtectedStudio",
);
export const ProtectedSettings = lazyNamed(
  () => import("@/pages/settings-pages"),
  "ProtectedSettings",
);
export const SettingsProfilePage = lazyNamed(
  () => import("@/pages/settings/settings-profile-page"),
  "SettingsProfilePage",
);
export const SettingsAccountPage = lazyNamed(
  () => import("@/pages/settings/settings-account-page"),
  "SettingsAccountPage",
);
export const SettingsMembershipPage = lazyNamed(
  () => import("@/pages/settings/settings-membership-page"),
  "SettingsMembershipPage",
);
export const SettingsBillingPage = lazyNamed(
  () => import("@/pages/settings/settings-billing-page"),
  "SettingsBillingPage",
);
export const SettingsWorksPage = lazyNamed(
  () => import("@/pages/settings/settings-works-page"),
  "SettingsWorksPage",
);
export const SettingsPublicationsPage = lazyNamed(
  () => import("@/pages/settings/settings-publications-page"),
  "SettingsPublicationsPage",
);
