import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

interface GenerateCertificateProps {
  recipientName: string;
  achievementType: string;
  cuid: string;
}

export async function generateCertificatePDF({
  recipientName,
  achievementType,
  cuid,
}: GenerateCertificateProps): Promise<Uint8Array> {
  // 1. Locate the correct certificate template asset based on achievement type
  let templateFileName = "1-Prime.pdf";
  const lowerType = achievementType.toLowerCase();

  if (lowerType.includes("elite")) {
    templateFileName = "2-Elite.pdf";
  } else if (lowerType.includes("merit")) {
    templateFileName = "3-Merit.pdf";
  } else if (lowerType.includes("honourable")) {
    templateFileName = "4-HonourableMention.pdf";
  } else if (lowerType.includes("participation")) {
    templateFileName = "5-Participation.pdf";
  }

  const templatePath = path.join(
    process.cwd(),
    "public",
    "certificates",
    templateFileName,
  );

  const finalTemplatePath = fs.existsSync(templatePath)
    ? templatePath
    : path.join(process.cwd(), "public", "certificates", "1-Prime.pdf");

  const templateBytes = fs.readFileSync(finalTemplatePath);

  // 2. Load PDF Document
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit as any);

  // 3. Load custom font (Trajan Pro Bold)
  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "TrajanPro-Bold.ttf",
  );
  const fontBytes = fs.readFileSync(fontPath);
  const trajanBold = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();

  // 4. Participant Name (Uppercase & Perfect Position)
  const formattedName = recipientName.toUpperCase();
  const fontSizeName = 24;
  const textWidth = trajanBold.widthOfTextAtSize(formattedName, fontSizeName);
  page.drawText(formattedName, {
    x: (width - textWidth) / 2,
    y: height * 0.67,
    size: fontSizeName,
    font: trajanBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // 5. Awarded On Date (Nicely centered above the left line)
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dateFontSize = 10;
  const dateWidth = trajanBold.widthOfTextAtSize(currentDate, dateFontSize);
  page.drawText(currentDate, {
    x: width * 0.33 - dateWidth / 2,
    y: height * 0.455,
    size: dateFontSize,
    font: trajanBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  // 6. CUID Number (Adjusted to 0.675)
  const cuidFontSize = 10;
  const cuidWidth = trajanBold.widthOfTextAtSize(cuid, cuidFontSize);
  page.drawText(cuid, {
    x: width * 0.675 - cuidWidth / 2, // Adjusted to 0.675
    y: height * 0.455,
    size: cuidFontSize,
    font: trajanBold,
    color: rgb(0.15, 0.15, 0.15),
  });

  // 7. Verification QR Code (Cleanly positioned in the bottom gap)
  const verifyUrl = `https://acob.org/verify/${cuid}`;
  const qrImageBuffer = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    margin: 1,
    width: 300,
  });
  const embeddedQrImage = await pdfDoc.embedPng(qrImageBuffer);

  page.drawImage(embeddedQrImage, {
    x: (width - 44) / 2,
    y: height * 0.085,
    width: 44,
    height: 44,
  });

  // 8. Serialize PDF bytes
  return await pdfDoc.save();
}
