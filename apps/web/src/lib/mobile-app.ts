/** iOS App Store / TestFlight 等下载链接 */
export const MOBILE_IOS_DOWNLOAD_URL =
  import.meta.env.VITE_MOBILE_IOS_DOWNLOAD_URL?.trim() || "";

/** Android 应用商店或 APK 下载页 */
export const MOBILE_ANDROID_DOWNLOAD_URL =
  import.meta.env.VITE_MOBILE_ANDROID_DOWNLOAD_URL?.trim() || "";

/** 统一落地页（未区分平台时使用，也可作为通用扫码链接） */
export const MOBILE_UNIVERSAL_DOWNLOAD_URL =
  import.meta.env.VITE_MOBILE_DOWNLOAD_URL?.trim() || "";

export function getMobileDownloadLinks() {
  const universal = MOBILE_UNIVERSAL_DOWNLOAD_URL;
  return {
    ios: MOBILE_IOS_DOWNLOAD_URL || universal,
    android: MOBILE_ANDROID_DOWNLOAD_URL || universal,
    hasIos: Boolean(MOBILE_IOS_DOWNLOAD_URL || universal),
    hasAndroid: Boolean(MOBILE_ANDROID_DOWNLOAD_URL || universal),
    hasAny: Boolean(
      MOBILE_IOS_DOWNLOAD_URL ||
        MOBILE_ANDROID_DOWNLOAD_URL ||
        universal,
    ),
  };
}
