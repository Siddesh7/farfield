import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { UserService } from "@/lib/services/user-service";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    // Check for specific user queries
    const privyId = searchParams.get("privyId");
    const farcasterFid = searchParams.get("farcasterFid");
    const walletAddress = searchParams.get("walletAddress");
    const username = searchParams.get("username");
    const userId = searchParams.get("id");

    // If specific query parameters are provided, return that user
    if (privyId) {
      const user = await UserService.getUserByPrivyId(privyId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    if (farcasterFid) {
      const fid = parseInt(farcasterFid);
      if (isNaN(fid)) {
        return NextResponse.json(
          { error: "Invalid farcasterFid format" },
          { status: 400 }
        );
      }
      const user = await UserService.getUserByFarcasterFid(fid);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    if (walletAddress) {
      const user = await UserService.getUserByWalletAddress(walletAddress);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    if (username) {
      const user = await UserService.getUserByUsername(username);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    if (userId) {
      const user = await UserService.getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    // If no specific query parameters are provided, return user not found
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
