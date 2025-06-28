import { PrivyClient } from "@privy-io/server-auth";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

// Initialize Privy client for server-side authentication
const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export interface AuthenticatedUser {
  privyId: string;
  sessionId: string;
  appId: string;
}

/**
 * Extract and verify Privy access token from request
 * Works with both Next.js API routes and App Router
 */
export async function verifyPrivyToken(
  request?: NextRequest
): Promise<AuthenticatedUser> {
  let authToken: string | null = null;

  if (request) {
    // For Next.js API routes (Pages Router)
    authToken =
      request.headers.get("authorization")?.replace("Bearer ", "") || null;
  } else {
    // For App Router
    const headersList = await headers();
    authToken =
      headersList.get("authorization")?.replace("Bearer ", "") || null;
  }

  if (!authToken) {
    throw new Error("Authentication token required");
  }

  try {
    const verifiedClaims = await privyClient.verifyAuthToken(authToken);

    return {
      privyId: verifiedClaims.userId,
      sessionId: verifiedClaims.sessionId,
      appId: verifiedClaims.appId,
    };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function withAuth<T extends any[]>(
  handler: (
    request: Request,
    authenticatedUser: AuthenticatedUser,
    ...args: T
  ) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      // Convert Request to NextRequest for verifyPrivyToken
      const nextRequest = request as NextRequest;
      const authenticatedUser = await verifyPrivyToken(nextRequest);
      return handler(request, authenticatedUser, ...args);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            error instanceof Error ? error.message : "Authentication failed",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}
