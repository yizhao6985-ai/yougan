import { generateDefaultDisplayName } from "./default-display-name.js";

const CHINA_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

export function normalizeChinaMobilePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && CHINA_MOBILE_PATTERN.test(digits)) {
    return digits;
  }
  if (digits.length === 13 && digits.startsWith("86")) {
    const phone = digits.slice(2);
    return CHINA_MOBILE_PATTERN.test(phone) ? phone : null;
  }
  return null;
}

export function isEmailLike(input: string): boolean {
  return input.includes("@");
}

export type LoginIdentifier =
  | { kind: "email"; email: string }
  | { kind: "phone"; phone: string };

export function parseLoginIdentifier(input: string): LoginIdentifier | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isEmailLike(trimmed)) {
    const email = trimmed.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return { kind: "email", email };
  }

  const phone = normalizeChinaMobilePhone(trimmed);
  if (!phone) return null;
  return { kind: "phone", phone };
}

export function maskChinaMobilePhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function formatAccountLabel(input: {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}): string {
  if (input.name?.trim()) return input.name.trim();
  const email = input.email?.trim();
  if (email && isEmailLike(email)) {
    return email.split("@")[0] || email;
  }
  const seed = input.id ?? input.phone;
  if (seed) return generateDefaultDisplayName(seed);
  return "有感";
}
