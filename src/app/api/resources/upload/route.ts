import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { resolvePermissions } from "@/lib/authz/guards";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await getCurrentSession();
        if (!session) throw new Error("Unauthorized");
        const permissions = await resolvePermissions(session.roleKeys);
        if (!permissions.has("content:create") && !permissions.has("content:update")) {
          throw new Error("You do not have permission to upload resource payment QR codes.");
        }
        return { allowedContentTypes: ["image/jpeg", "image/png", "image/webp"] };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
