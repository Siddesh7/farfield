import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/user-db";

export async function POST(req: NextRequest) {
  try {
    const user = await req.json();
    const dbUser = await upsertUser(user);
    return NextResponse.json(dbUser);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
