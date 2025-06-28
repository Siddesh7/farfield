"use client";

import { usePrivy } from "@privy-io/react-auth";
import {
  useAuthenticatedAPI,
  useAuthenticatedFetch,
} from "@/lib/hooks/use-authenticated-fetch";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TestResult {
  endpoint: string;
  status: "success" | "error" | "pending";
  data?: any;
  error?: string;
  duration?: number;
}

export default function TestPage() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { get, post, put, delete: del } = useAuthenticatedAPI();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const runTest = async (
    name: string,
    testFn: () => Promise<any>,
    description?: string
  ) => {
    const startTime = Date.now();
    addResult({ endpoint: name, status: "pending" });

    try {
      const data = await testFn();
      const duration = Date.now() - startTime;

      setResults((prev) =>
        prev.map((r) =>
          r.endpoint === name && r.status === "pending"
            ? { ...r, status: "success", data, duration }
            : r
        )
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;

      setResults((prev) =>
        prev.map((r) =>
          r.endpoint === name && r.status === "pending"
            ? { ...r, status: "error", error: error.message, duration }
            : r
        )
      );
    }
  };

  // Test Functions
  const testGetMe = () =>
    runTest(
      "GET /api/users/me",
      () => get("/api/users/me"),
      "Get current authenticated user"
    );

  const testUpdateMe = () =>
    runTest(
      "PUT /api/users/me",
      () =>
        put("/api/users/me", {
          farcaster: {
            displayName: "Test User Updated",
            bio: "Updated bio from test page",
          },
        }),
      "Update current user profile"
    );

  const testUpdateFarcaster = () =>
    runTest(
      "PUT /api/users/me/farcaster",
      () =>
        put("/api/users/me/farcaster", {
          displayName: "Test Farcaster Update",
          bio: "Updated Farcaster bio",
          pfp: "https://example.com/test-pfp.jpg",
        }),
      "Update Farcaster profile"
    );

  const testAddWallet = () =>
    runTest(
      "POST /api/users/me/wallet",
      () =>
        post("/api/users/me/wallet", {
          address: "0x1234567890123456789012345678901234567890",
          chainType: "ethereum",
          walletClientType: "test",
          connectorType: "test",
        }),
      "Add new wallet"
    );

  const testRemoveWallet = () =>
    runTest(
      "DELETE /api/users/me/wallet",
      async () => {
        const response = await authenticatedFetch("/api/users/me/wallet", {
          method: "DELETE",
          body: JSON.stringify({
            address: "0x1234567890123456789012345678901234567890",
          }),
        });
        return response.json();
      },
      "Remove wallet"
    );

  const testRegisterUser = () =>
    runTest(
      "POST /api/users/register",
      () =>
        post("/api/users/register", {
          privyId: user?.id,
          farcasterFid: user?.farcaster?.fid || 12345,
          farcaster: {
            ownerAddress:
              user?.farcaster?.ownerAddress ||
              "0x1234567890123456789012345678901234567890",
            displayName: user?.farcaster?.displayName || "Test User",
            username: user?.farcaster?.username || "testuser",
            bio: user?.farcaster?.bio || "Test bio",
            pfp: user?.farcaster?.pfp || "https://example.com/pfp.jpg",
          },
          wallet: {
            address:
              user?.wallet?.address ||
              "0x1234567890123456789012345678901234567890",
            chainType: user?.wallet?.chainType || "ethereum",
          },
        }),
      "Register/Create new user (might fail if already exists)"
    );

  // Public endpoint tests (no authentication needed)
  const testPublicEndpoints = async () => {
    // Test list users
    await runTest(
      "GET /api/users",
      () => fetch("/api/users?page=1&limit=5").then((r) => r.json()),
      "List all users (public)"
    );

    // Test search users
    await runTest(
      "GET /api/users/search",
      () => fetch("/api/users/search?query=test&limit=3").then((r) => r.json()),
      "Search users (public)"
    );

    // If we have a user, test lookup endpoints
    if (user?.farcaster?.username) {
      await runTest(
        "GET /api/users/username/[username]",
        () =>
          fetch(`/api/users/username/${user.farcaster?.username}`).then((r) =>
            r.json()
          ),
        "Get user by username (public)"
      );
    }

    if (user?.farcaster?.fid) {
      await runTest(
        "GET /api/users/fid/[fid]",
        () =>
          fetch(`/api/users/fid/${user.farcaster?.fid}`).then((r) => r.json()),
        "Get user by FID (public)"
      );
    }

    if (user?.id) {
      await runTest(
        "GET /api/users/privy/[privyId]",
        () => fetch(`/api/users/privy/${user.id}`).then((r) => r.json()),
        "Get user by Privy ID (public)"
      );
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      // Test authentication required endpoints
      await testRegisterUser();
      await testGetMe();
      await testUpdateMe();
      await testUpdateFarcaster();
      await testAddWallet();
      await testRemoveWallet(); // This might fail if it's the last wallet

      // Test public endpoints
      await testPublicEndpoints();
    } finally {
      setIsRunning(false);
    }
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      await testRegisterUser();
      await testGetMe();
      await testUpdateMe();
      await testUpdateFarcaster();
    } finally {
      setIsRunning(false);
    }
  };

  const runWalletTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      await testAddWallet();
      await testRemoveWallet();
    } finally {
      setIsRunning(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading Privy...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
          <p className="text-gray-600 mb-6">
            Please log in with Privy to test the authenticated API endpoints.
          </p>
          <Button onClick={login} className="w-full">
            Login with Privy
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">API Test Dashboard</h1>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>

          {user && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="font-semibold mb-2">Authenticated User Info</h2>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Privy ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Farcaster Username:</strong>{" "}
                  {user.farcaster?.username || "N/A"}
                </p>
                <p>
                  <strong>Farcaster FID:</strong> {user.farcaster?.fid || "N/A"}
                </p>
                <p>
                  <strong>Display Name:</strong>{" "}
                  {user.farcaster?.displayName || "N/A"}
                </p>
                <p>
                  <strong>Wallet:</strong> {user.wallet?.address || "N/A"}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? "Running..." : "Run All Tests"}
            </Button>
            <Button
              onClick={runAuthTests}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              Auth Tests Only
            </Button>
            <Button
              onClick={runWalletTests}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              Wallet Tests Only
            </Button>
            <Button
              onClick={clearResults}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              Clear Results
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Button onClick={testGetMe} disabled={isRunning} size="sm">
              Test GET /me
            </Button>
            <Button onClick={testUpdateMe} disabled={isRunning} size="sm">
              Test UPDATE /me
            </Button>
            <Button
              onClick={testUpdateFarcaster}
              disabled={isRunning}
              size="sm"
            >
              Test UPDATE Farcaster
            </Button>
            <Button onClick={testAddWallet} disabled={isRunning} size="sm">
              Test ADD Wallet
            </Button>
            <Button onClick={testRemoveWallet} disabled={isRunning} size="sm">
              Test REMOVE Wallet
            </Button>
            <Button onClick={testRegisterUser} disabled={isRunning} size="sm">
              Test REGISTER User
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Test Results</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status === "success"
                      ? "bg-green-50 border-green-400"
                      : result.status === "error"
                      ? "bg-red-50 border-red-400"
                      : "bg-yellow-50 border-yellow-400"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{result.endpoint}</h3>
                    <div className="flex items-center space-x-2">
                      {result.duration && (
                        <span className="text-xs text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          result.status === "success"
                            ? "bg-green-200 text-green-800"
                            : result.status === "error"
                            ? "bg-red-200 text-red-800"
                            : "bg-yellow-200 text-yellow-800"
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                  </div>

                  {result.error && (
                    <div className="text-red-600 text-sm mb-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}

                  {result.data && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        Show Response Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Instructions</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>🔒 Protected Endpoints:</strong> Require Privy
              authentication (all /api/users/me/* routes)
            </p>
            <p>
              <strong>🌍 Public Endpoints:</strong> No authentication needed
              (user lookup routes)
            </p>
            <p>
              <strong>⚠️ Expected Errors:</strong> Some tests may fail if user
              already exists or wallet limits reached
            </p>
            <p>
              <strong>🧪 Test Types:</strong> Authentication tests verify token
              handling, wallet tests check multiple wallet management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
