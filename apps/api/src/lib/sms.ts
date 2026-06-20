import crypto from "node:crypto";

import { env } from "../env.js";

export async function sendSmsVerificationCode(
  phone: string,
  code: string,
): Promise<{ devCode?: string }> {
  if (env.sms.provider === "aliyun") {
    await sendAliyunSms(phone, code);
    return {};
  }

  console.info(`[sms] Verification code for ${phone}: ${code}`);
  if (!env.isProduction) {
    return { devCode: code };
  }

  throw new Error("SMS_NOT_CONFIGURED");
}

async function sendAliyunSms(phone: string, code: string) {
  const { accessKeyId, accessKeySecret, signName, templateCode, regionId } =
    env.sms.aliyun;

  if (
    !accessKeyId ||
    !accessKeySecret ||
    !signName ||
    !templateCode
  ) {
    throw new Error("SMS_NOT_CONFIGURED");
  }

  const params = new URLSearchParams({
    Action: "SendSms",
    Version: "2017-05-25",
    RegionId: regionId,
    PhoneNumbers: phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Format: "JSON",
    SignatureMethod: "HMAC-SHA1",
    SignatureVersion: "1.0",
    SignatureNonce: crypto.randomUUID(),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    AccessKeyId: accessKeyId,
  });

  const canonicalized = canonicalizeAliyunParams(params);
  const stringToSign = `GET&${encodeURIComponent("/")}&${encodeURIComponent(canonicalized)}`;
  const signature = crypto
    .createHmac("sha1", `${accessKeySecret}&`)
    .update(stringToSign)
    .digest("base64");

  params.set("Signature", signature);

  const response = await fetch(
    `https://dysmsapi.aliyuncs.com/?${params.toString()}`,
  );
  const payload = (await response.json()) as {
    Code?: string;
    Message?: string;
  };

  if (!response.ok || payload.Code !== "OK") {
    throw new Error(payload.Message ?? "SMS send failed");
  }
}

function canonicalizeAliyunParams(params: URLSearchParams) {
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}
