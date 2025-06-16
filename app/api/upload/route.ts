import { NextResponse } from "next/server";
import { storeFile } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.error("No file provided in form data");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileKey = await storeFile({
      buffer,
      originalname: file.name,
      mimetype: file.type,
    });

    const fileUrl = `${process.env.R2_ENDPOINT}/${fileKey}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      fileKey,
      fileUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
