import "server-only";
import QRCode from "qrcode";
import { getSiteUrl } from "@/lib/env";

/** Generates a QR code (as a data: URL) encoding the certificate's verification link. */
export async function generateVerifyQrDataUrl(verificationToken: string): Promise<string> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/verify?token=${verificationToken}`;
  return QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#08080a", light: "#f7f7f5" } });
}
