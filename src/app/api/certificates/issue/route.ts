import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";
import { generateCertificatePDF } from "@/lib/certificateGenerator";
import { put } from "@vercel/blob";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const issuerId = session.id;

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

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const cuid = `ACOB-2026-${randomNum}`;
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const pdfBytes = await generateCertificatePDF({
      recipientName,
      achievementType,
      cuid,
    });

    let finalCertificateUrl = certificateFileUrl;

    if (!finalCertificateUrl) {
      const fileName = `certificates/${cuid}-${recipientName.replace(/\s+/g, "_")}.pdf`;

      const blob = await put(fileName, Buffer.from(pdfBytes), {
        access: "public",
        contentType: "application/pdf",
      });

      finalCertificateUrl = blob.url;
    }

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

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${recipientName.replace(/\s+/g, "_")}-ACOB-Certificate-${cuid}.pdf"`,
        "X-CUID": cuid,
      },
    });
  } catch (error: unknown) {
    console.error("Error issuing certificate:", error);

    const message =
      error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

