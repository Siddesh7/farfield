import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { UserService } from "@/lib/services/user-service";
import { User as UserType } from "@/lib/types/user";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "privyId",
      "farcasterFid",
      "farcaster.ownerAddress",
      "farcaster.displayName",
      "farcaster.username",
      "wallet.address",
      "wallet.chainType",
      "wallet.walletClientType",
      "wallet.connectorType",
    ];

    for (const field of requiredFields) {
      const keys = field.split(".");
      let value = body;
      for (const key of keys) {
        value = value?.[key];
      }
      if (!value) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate farcasterFid is a number
    if (typeof body.farcasterFid !== "number") {
      return NextResponse.json(
        { error: "farcasterFid must be a number" },
        { status: 400 }
      );
    }

    // Create the user
    const userData: Omit<UserType, "_id" | "createdAt" | "updatedAt"> = {
      privyId: body.privyId,
      farcasterFid: body.farcasterFid,
      farcaster: {
        ownerAddress: body.farcaster.ownerAddress,
        displayName: body.farcaster.displayName,
        username: body.farcaster.username,
        bio: body.farcaster.bio,
        pfp: body.farcaster.pfp,
      },
      wallet: {
        address: body.wallet.address,
        chainType: body.wallet.chainType,
        walletClientType: body.wallet.walletClientType,
        connectorType: body.wallet.connectorType,
      },
    };

    const user = await UserService.createUser(userData);

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          _id: user._id,
          privyId: user.privyId,
          farcasterFid: user.farcasterFid,
          farcaster: user.farcaster,
          wallet: user.wallet,
          createdAt: (user as any).createdAt,
          updatedAt: (user as any).updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error.message.includes("Validation error")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
