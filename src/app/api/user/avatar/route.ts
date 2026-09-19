import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { requireAuth } from "@/lib/authz/guards";
import { db } from "@/lib/db/client";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Fetch existing profile to check if there's an old avatar to clean up from Blob storage
    const existingProfile = await db.profile.findUnique({
      where: { userId: session.id },
      select: { avatarUrl: true },
    });

    if (existingProfile?.avatarUrl) {
      try {
        await del(existingProfile.avatarUrl);
      } catch (e) {
        console.error("Failed to delete old avatar blob:", e);
      }
    }

    // Upload new image to Vercel Blob with public access
    const blob = await put(`avatars/${session.id}-${Date.now()}.jpg`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    // Upsert or update the user's profile with the new public avatar URL
    await db.profile.upsert({
      where: { userId: session.id },
      update: { avatarUrl: blob.url },
      create: {
        userId: session.id,
        fullName: session.fullName ?? session.email,
        avatarUrl: blob.url,
      },
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.profile.findUnique({
      where: { userId: session.id },
      select: { avatarUrl: true },
    });

    if (profile?.avatarUrl) {
      try {
        await del(profile.avatarUrl);
      } catch (e) {
        console.error("Failed to delete avatar blob:", e);
      }

      await db.profile.update({
        where: { userId: session.id },
        data: { avatarUrl: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
