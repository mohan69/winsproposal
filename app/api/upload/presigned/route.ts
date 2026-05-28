export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generatePresignedUploadUrl } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { fileName, contentType, isPublic } = body ?? {};
    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName and contentType are required" }, { status: 400 });
    }
    const missingAwsEnv = [
      !process.env.AWS_REGION?.trim() ? "AWS_REGION" : "",
      !(process.env.S3_BUCKET_NAME?.trim() || process.env.AWS_BUCKET_NAME?.trim()) ? "S3_BUCKET_NAME or AWS_BUCKET_NAME" : "",
      !(process.env.S3_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim()) ? "S3_ACCESS_KEY_ID or AWS_ACCESS_KEY_ID" : "",
      !(process.env.S3_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim()) ? "S3_SECRET_ACCESS_KEY or AWS_SECRET_ACCESS_KEY" : "",
    ].filter(Boolean);
    if (missingAwsEnv.length > 0) {
      console.error("Missing AWS upload environment variables:", missingAwsEnv.join(", "));
    }
    const result = await generatePresignedUploadUrl(fileName, contentType, isPublic ?? false);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
