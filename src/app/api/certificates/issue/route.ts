import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { generateCertificatePDF } from "@/lib/certificateGenerator";
import { put } from "@vercel/blob";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session: any = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const issuerId = session.user?.id || session.userId || session.id;
    if (!issuerId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid session payload" },
        { status: 401 },
      );
    }

    const canIssue = await hasPermission("certificate:issue");
    if (!canIssue) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { recipientEmail, olympiadId, achievementType, certificateFileUrl } =
      body;

    if (!recipientEmail || !olympiadId || !achievementType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Find recipient user and profile to fetch their real full name
    const recipientUser = await db.user.findUnique({
      where: { email: recipientEmail },
      include: { profile: true },
    });

    if (!recipientUser) {
      return NextResponse.json(
        { error: "Recipient user not found with this email" },
        { status: 404 },
      );
    }

    const recipientName =
      recipientUser.profile?.fullName || recipientUser.email.split("@")[0];

    // 2. Generate unique CUID and verification token
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const cuid = `ACOB-2026-${randomNum}`;
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 3. Directly call your real certificate generator (no hidden fallback placeholders)
    const pdfBytes = await generateCertificatePDF({
      recipientName,
      achievementType,
      cuid,
    });

    // 4. Upload the PDF to Vercel Blob
    let finalCertificateUrl = certificateFileUrl;
    if (!finalCertificateUrl) {
      const fileName = `certificates/${cuid}-${recipientName.replace(/\s+/g, "_")}.pdf`;
      const blob = await put(fileName, Buffer.from(pdfBytes), {
        access: "public",
        contentType: "application/pdf",
      });
      finalCertificateUrl = blob.url;
    }

    // 5. Save the certificate record in Prisma
    await db.certificate.create({
      data: {
        certificateId: cuid,
        verificationToken,
        achievement: achievementType.toLowerCase(),
        status: "valid",
        fileUrl: finalCertificateUrl,
        recipient: {
          connect: { id: recipientUser.id },
        },
        issuer: {
          connect: { id: issuerId },
        },
        olympiad: {
          connect: { id: olympiadId },
        },
      },
    });

    // 6. Return the PDF file back for download
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${recipientName.replace(/\s+/g, "_")}-ACOB-Certificate-${cuid}.pdf"`,
        "X-CUID": cuid,
      },
    });
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
