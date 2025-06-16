import { NextResponse } from "next/server";
import { getFileStream } from "@/lib/r2";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key) {
      return NextResponse.json(
        { error: "No file key provided" },
        { status: 400 }
      );
    }

    console.log(`Fetching file with key: ${key}`);
    const stream = await getFileStream(key);

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream"); // Generic type, adjust if needed
    headers.set(
      "Content-Disposition",
      `inline; filename="${key.split("_").pop()}"`
    ); // Extract original name

    return new NextResponse(stream as any, { headers, status: 200 });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 500 }
    );
  }
}
