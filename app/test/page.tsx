"use client";

import { usePrivy } from "@privy-io/react-auth";
import {
  useAuthenticatedAPI,
  useAuthenticatedFetch,
} from "@/lib/hooks/use-authenticated-fetch";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAccount, useSendTransaction } from "wagmi";
import {
  FARFIELD_CONTRACT_ADDRESS,
  usdcContract,
  usdcUtils,
} from "@/lib/blockchain";

interface TestResult {
  endpoint: string;
  status: "success" | "error" | "pending";
  data?: any;
  error?: string;
  duration?: number;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  hasExternalLinks: boolean;
  images: string[] | string;
  digitalFiles: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  externalLinks: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  previewFiles: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  previewLinks: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  tags: string[] | string;
  fileFormat: string[] | string;
  discountPercentage?: number;
  previewAvailable?: boolean;
}

export default function TestPage() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { get, post, put, delete: del } = useAuthenticatedAPI();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const [autopublish, setAutopublish] = useState(false);

  // Form data states
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: "Test Product",
    description:
      "This is a test product created from the API test page. It includes comprehensive testing data to validate all product creation functionality.",
    price: 29.99,
    category: "Design",
    hasExternalLinks: false,
    images: [],
    digitalFiles: [],
    externalLinks: [
      {
        name: "Figma File",
        url: "https://figma.com/file/example",
        type: "figma",
      },
    ],
    previewFiles: [],
    previewLinks: [],
    tags: ["test", "api", "figma"],
    fileFormat: ["PDF", "Figma"],
    discountPercentage: 10,
  });

  const [updateForm, setUpdateForm] = useState<{
    name: string;
    description: string;
    price: number;
    tags: string[] | string;
  }>({
    name: "Updated Test Product",
    description: "This product has been updated via API test",
    price: 39.99,
    tags: ["updated", "test", "api"],
  });

  const [commentText, setCommentText] = useState(
    "This is a test comment added via API testing interface. Great product!"
  );
  const [ratingValue, setRatingValue] = useState(5);
  const [manualProductId, setManualProductId] = useState("");

  // --- Buy Product (Onchain) State ---
  const [buyStep, setBuyStep] = useState<
    "init" | "signing" | "confirming" | "done"
  >("init");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyTxs, setBuyTxs] = useState<any[]>([]);
  const [buyPurchaseId, setBuyPurchaseId] = useState<string | null>(null);
  const [buyFinalTxHash, setBuyFinalTxHash] = useState<string | null>(null);

  // --- Approve USDC State ---
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approveSuccess, setApproveSuccess] = useState<string | null>(null);

  // --- Purchased Products State ---
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any>(null);

  // --- Product Access State ---
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [productAccess, setProductAccess] = useState<any>(null);

  // Inside TestPage component
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  useEffect(() => {
    const fetchImagesWithAuth = async () => {
      if (!productAccess || !productAccess.images || !authenticated) {
        setImageUrls([]);
        return;
      }
      const urls = await Promise.all(
        productAccess.images.map(async (imgKey: string) => {
          try {
            const res = await authenticatedFetch(`/api/files/${imgKey}`, {
              method: "GET",
            });
            if (!res.ok) return "";
            const blob = await res.blob();
            return URL.createObjectURL(blob);
          } catch {
            return "";
          }
        })
      );
      setImageUrls(urls);
    };
    fetchImagesWithAuth();
    // Cleanup: revoke object URLs on unmount or change
    return () => {
      imageUrls.forEach((url) => url && URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productAccess, authenticated]);

  // Helper to get current product ID (manual override or auto-generated)
  const getCurrentProductId = () => {
    return manualProductId.trim() || createdProductId;
  };

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
    setCreatedProductId(null);
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

      return data;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      setResults((prev) =>
        prev.map((r) =>
          r.endpoint === name && r.status === "pending"
            ? { ...r, status: "error", error: error.message, duration }
            : r
        )
      );

      throw error;
    }
  };

  // ========== USER API TESTS (EXISTING) ==========
  const testGetMe = useCallback(
    () =>
      runTest(
        "GET /api/users/me",
        () => get("/api/users/me"),
        "Get current authenticated user"
      ),
    [get]
  );

  const testUpdateMe = useCallback(
    () =>
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
      ),
    [put]
  );

  const testUpdateFarcaster = () =>
    runTest(
      "PUT /api/users/me/farcaster",
      () =>
        put("/api/users/me/farcaster", {
          displayName: "Test Farcaster Update",
          bio: "Updated Farcaster bio",
          pfp: "",
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
            pfp: user?.farcaster?.pfp || "",
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

  // ========== PRODUCT API TESTS (NEW) ==========

  // Product CRUD Tests
  const testCreateProduct = async () => {
    const basePayload = {
      ...productForm,
      tags: Array.isArray(productForm.tags)
        ? productForm.tags
        : productForm.tags.split(",").map((t: string) => t.trim()),
      fileFormat: Array.isArray(productForm.fileFormat)
        ? productForm.fileFormat
        : productForm.fileFormat.split(",").map((f: string) => f.trim()),
      images: Array.isArray(productForm.images)
        ? productForm.images
        : productForm.images.split(",").map((i: string) => i.trim()),
    };

    // Only include preview fields if non-empty
    const basePayloadWithOptional = basePayload as Partial<typeof basePayload>;
    const hasPreviewFiles =
      productForm.previewFiles && productForm.previewFiles.length > 0;
    const hasPreviewLinks =
      productForm.previewLinks && productForm.previewLinks.length > 0;

    if (hasPreviewFiles) {
      basePayloadWithOptional.previewFiles = productForm.previewFiles;
    } else {
      delete basePayloadWithOptional.previewFiles;
    }
    if (hasPreviewLinks) {
      basePayloadWithOptional.previewLinks = productForm.previewLinks;
    } else {
      delete basePayloadWithOptional.previewLinks;
    }
    if (hasPreviewFiles || hasPreviewLinks) {
      basePayloadWithOptional.previewAvailable = true;
    } else {
      delete basePayloadWithOptional.previewAvailable;
    }

    // Clean up payload based on hasExternalLinks
    const payload = basePayloadWithOptional.hasExternalLinks
      ? {
          ...basePayloadWithOptional,
          digitalFiles: undefined,
          externalLinks: basePayloadWithOptional.externalLinks,
        }
      : {
          ...basePayloadWithOptional,
          externalLinks: undefined,
          digitalFiles: basePayloadWithOptional.digitalFiles,
        };
    console.log("payload", payload);
    let url = "/api/products";
    if (autopublish) {
      url += "?publish=true";
    }
    const result = await runTest(
      "POST /api/products",
      () => post(url, payload),
      "Create new product (Protected)"
    );

    if (result?.data?._id) {
      setCreatedProductId(result.data._id);
    }
    setShowProductForm(false);
    return result;
  };

  const testGetProducts = () =>
    runTest(
      "GET /api/products",
      () => fetch("/api/products?page=1&limit=5").then((r) => r.json()),
      "Browse all products (Public)"
    );

  const testSearchProducts = () =>
    runTest(
      "GET /api/products/search",
      () =>
        fetch("/api/products/search?q=test&page=1&limit=3").then((r) =>
          r.json()
        ),
      "Search products (Public)"
    );

  const testGetCategories = () =>
    runTest(
      "GET /api/products/categories",
      () => fetch("/api/products/categories").then((r) => r.json()),
      "Get product categories (Public)"
    );

  const testGetMyProducts = () =>
    runTest(
      "GET /api/products/my",
      () => get("/api/products/my?page=1&limit=5"),
      "Get my products (Protected)"
    );

  const testGetProductById = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    return runTest(
      "GET /api/products/[id]",
      () => fetch(`/api/products/${productId}`).then((r) => r.json()),
      "Get product by ID (Public)"
    );
  };

  const testUpdateProduct = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }

    const payload = {
      ...updateForm,
      tags: Array.isArray(updateForm.tags)
        ? updateForm.tags
        : updateForm.tags.split(",").map((t: string) => t.trim()),
    };

    const result = runTest(
      "PUT /api/products/[id]",
      () => put(`/api/products/${productId}`, payload),
      "Update product (Protected - Creator only)"
    );

    setShowUpdateForm(false);
    return result;
  };

  const testPublishProduct = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    return runTest(
      "POST /api/products/[id]/publish",
      () =>
        post(`/api/products/${productId}/publish`, {
          published: true,
        }),
      "Publish product (Protected - Creator only)"
    );
  };

  const testUnpublishProduct = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    return runTest(
      "POST /api/products/[id]/publish (unpublish)",
      () =>
        post(`/api/products/${productId}/publish`, {
          published: false,
        }),
      "Unpublish product (Protected - Creator only)"
    );
  };

  // Comments Tests
  const testGetProductComments = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    return runTest(
      "GET /api/products/[id]/comments",
      () =>
        fetch(`/api/products/${productId}/comments?page=1&limit=5`).then((r) =>
          r.json()
        ),
      "Get product comments (Public)"
    );
  };

  const testAddProductComment = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    const result = runTest(
      "POST /api/products/[id]/comments",
      () =>
        post(`/api/products/${productId}/comments`, {
          comment: commentText,
        }),
      "Add product comment (Protected)"
    );

    setShowCommentForm(false);
    return result;
  };

  // Ratings Tests
  const testGetProductRatings = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    return runTest(
      "GET /api/products/[id]/ratings",
      () => fetch(`/api/products/${productId}/ratings`).then((r) => r.json()),
      "Get product ratings (Public)"
    );
  };

  const testAddProductRating = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    const result = runTest(
      "POST /api/products/[id]/ratings",
      () =>
        post(`/api/products/${productId}/ratings`, {
          rating: ratingValue,
        }),
      "Add product rating (Protected)"
    );

    setShowRatingForm(false);
    return result;
  };

  const testDeleteProduct = () => {
    const productId = getCurrentProductId();
    if (!productId) {
      throw new Error(
        "No product ID available. Either create a product first or enter a manual product ID."
      );
    }
    return runTest(
      "DELETE /api/products/[id]",
      () => del(`/api/products/${productId}`),
      "Delete product (Protected - Creator only)"
    ).then((result) => {
      // Clear the auto-generated ID if we're using it, keep manual ID
      if (!manualProductId.trim() && createdProductId) {
        setCreatedProductId(null);
      }
      return result;
    });
  };

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

  // Test runners
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

  const runAllProductTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      // Product CRUD flow
      await testCreateProduct();
      await testGetProducts();
      await testSearchProducts();
      await testGetCategories();
      await testGetMyProducts();

      if (createdProductId) {
        await testGetProductById();
        await testUpdateProduct();
        await testPublishProduct();
        await testGetProductComments();
        await testAddProductComment();
        await testGetProductRatings();
        // Note: Rating test might fail if user tries to rate their own product
        // await testAddProductRating();
        await testUnpublishProduct();
        // Keep product for manual testing - don't auto-delete
        // await testDeleteProduct();
      }
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

  const runPublicProductTests = async () => {
    setIsRunning(true);
    clearResults();

    try {
      await testGetProducts();
      await testSearchProducts();
      await testGetCategories();

      if (createdProductId) {
        await testGetProductById();
        await testGetProductComments();
        await testGetProductRatings();
      }
    } finally {
      setIsRunning(false);
    }
  };

  // --- Buy Product (Onchain) Logic ---
  const runBuyStep = async (name: string, fn: () => Promise<any>) => {
    setBuyError(null);
    setBuyLoading(true);
    addResult({ endpoint: name, status: "pending" });
    const start = Date.now();
    try {
      const data = await fn();
      addResult({
        endpoint: name,
        status: "success",
        data,
        duration: Date.now() - start,
      });
      return data;
    } catch (e: any) {
      addResult({
        endpoint: name,
        status: "error",
        error: e.message,
        duration: Date.now() - start,
      });
      setBuyError(e.message);
      throw e;
    } finally {
      setBuyLoading(false);
    }
  };

  const initiateBuy = async () => {
    setBuyStep("init");
    setBuyError(null);
    setBuyTxs([]);
    setBuyPurchaseId(null);
    setBuyFinalTxHash(null);
    const productId = getCurrentProductId();
    if (!productId) return;
    await runBuyStep("POST /api/purchase/initiate", async () => {
      const res = await post("/api/purchase/initiate", {
        items: [{ productId }],
        buyerWallet: address,
      });
      setBuyTxs(res.data.transactions);
      setBuyPurchaseId(res.data.purchaseId);
      setBuyStep("signing");
      return res;
    });
  };

  const executeBuyTxs = async () => {
    setBuyError(null);
    setBuyStep("signing");
    await runBuyStep("wallet.sendTransaction (purchase)", async () => {
      let lastTxHash = null;
      for (const tx of buyTxs) {
        const hash = await sendTransactionAsync({
          to: tx.to,
          data: tx.data,
          value: BigInt(0),
          chainId: 84532,
        });
        lastTxHash = hash;
      }
      setBuyFinalTxHash(lastTxHash);
      setBuyStep("confirming");
      return { txHash: lastTxHash };
    });
  };

  const confirmBuy = async () => {
    setBuyStep("confirming");
    setBuyError(null);
    await runBuyStep("POST /api/purchase/confirm", async () => {
      const res = await post("/api/purchase/confirm", {
        purchaseId: buyPurchaseId,
        transactionHash: buyFinalTxHash,
      });
      setBuyStep("done");
      return res;
    });
  };

  // Approve USDC for Farfield contract
  const handleApproveUSDC = async () => {
    setApproveLoading(true);
    setApproveError(null);
    setApproveSuccess(null);
    try {
      // Approve a large amount (100,000 USDC)
      const amount = usdcUtils.toUnits(100000);
      const approvalTx = usdcContract.generateApprovalTransaction(
        FARFIELD_CONTRACT_ADDRESS as `0x${string}`,
        amount
      );
      const hash = await sendTransactionAsync({
        to: approvalTx.to as `0x${string}`,
        data: approvalTx.data,
        value: BigInt(0),
        gas: BigInt(50000),
      });
      setApproveSuccess(hash);
      addResult({
        endpoint: "wallet.sendTransaction (approve USDC)",
        status: "success",
        data: { txHash: hash },
      });
    } catch (e: any) {
      setApproveError(e.message);
      addResult({
        endpoint: "wallet.sendTransaction (approve USDC)",
        status: "error",
        error: e.message,
      });
    } finally {
      setApproveLoading(false);
    }
  };

  // Fetch purchase history
  const fetchPurchaseHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    setPurchaseHistory(null);
    try {
      const res = await get("/api/purchase/history?page=1&limit=10");
      setPurchaseHistory(res.data);
    } catch (e: any) {
      setHistoryError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch product access for current product
  const fetchProductAccess = async () => {
    setAccessLoading(true);
    setAccessError(null);
    setProductAccess(null);
    const productId = getCurrentProductId();
    if (!productId) {
      setAccessError("No product ID available.");
      setAccessLoading(false);
      return;
    }
    try {
      const res = await get(`/api/products/${productId}/access`);
      setProductAccess(res.data);
    } catch (e: any) {
      setAccessError(e.message);
    } finally {
      setAccessLoading(false);
    }
  };

  // Use authenticatedFetch for file download with auth token
  const handleAuthenticatedDownload = async (file: {
    url: string;
    fileName: string;
  }) => {
    try {
      const response = await authenticatedFetch(file.url, { method: "GET" });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Download failed: " + err.message);
    }
  };

  // Form component for product creation
  const ProductForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">
          Create Product - Customize Data
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={productForm.name}
              onChange={(e) =>
                setProductForm({ ...productForm, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md h-24"
              value={productForm.description}
              onChange={(e) =>
                setProductForm({ ...productForm, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    price: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product Images
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {Array.isArray(productForm.images) &&
                productForm.images.length > 0 &&
                productForm.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img
                      src={typeof img === "string" ? img : ""}
                      alt={`Product image ${idx + 1}`}
                      className="object-cover w-full h-full rounded border"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-xs"
                      onClick={() => {
                        setProductForm((prev) => ({
                          ...prev,
                          images: Array.isArray(prev.images)
                            ? prev.images.filter((_, i) => i !== idx)
                            : [],
                        }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const file of files) {
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    const res = await fetch("/api/files/upload", {
                      method: "POST",
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.success) {
                      setProductForm((prev) => ({
                        ...prev,
                        images: [
                          ...(Array.isArray(prev.images) ? prev.images : []),
                          data.data.fileKey,
                        ],
                      }));
                    } else {
                      alert(data.error || "Image upload failed");
                    }
                  } catch (err) {
                    alert("Image upload failed");
                  }
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={
                Array.isArray(productForm.tags)
                  ? productForm.tags.join(", ")
                  : productForm.tags
              }
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  tags: e.target.value.split(",").map((t) => t.trim()),
                })
              }
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={productForm.hasExternalLinks}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    hasExternalLinks: e.target.checked,
                  })
                }
              />
              Use External Links (instead of digital files)
            </label>
          </div>

          {!productForm.hasExternalLinks ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Digital Files
                </label>
                <div className="space-y-2">
                  {productForm.digitalFiles.map((file, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder="File name"
                        className="p-2 border border-gray-300 rounded-md"
                        value={file.fileName}
                        onChange={(e) => {
                          const newFiles = [...productForm.digitalFiles];
                          newFiles[index] = {
                            ...file,
                            fileName: e.target.value,
                          };
                          setProductForm({
                            ...productForm,
                            digitalFiles: newFiles,
                          });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="File key"
                        className="p-2 border border-gray-300 rounded-md"
                        value={file.fileUrl}
                        readOnly
                      />
                      <input
                        type="number"
                        placeholder="File size (bytes)"
                        className="p-2 border border-gray-300 rounded-md"
                        value={file.fileSize}
                        onChange={(e) => {
                          const newFiles = [...productForm.digitalFiles];
                          newFiles[index] = {
                            ...file,
                            fileSize: parseInt(e.target.value),
                          };
                          setProductForm({
                            ...productForm,
                            digitalFiles: newFiles,
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf,text/plain,application/json"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Preview Files
                </label>
                <div className="space-y-2">
                  {productForm.previewFiles.map((file, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-4 gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder="File name"
                        className="p-2 border border-gray-300 rounded-md"
                        value={file.fileName}
                        onChange={(e) => {
                          const newFiles = [...productForm.previewFiles];
                          newFiles[index] = {
                            ...file,
                            fileName: e.target.value,
                          };
                          setProductForm({
                            ...productForm,
                            previewFiles: newFiles,
                          });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="File key"
                        className="p-2 border border-gray-300 rounded-md"
                        value={file.fileUrl}
                        readOnly
                      />
                      <input
                        type="number"
                        placeholder="File size (bytes)"
                        className="p-2 border border-gray-300 rounded-md"
                        value={file.fileSize}
                        onChange={(e) => {
                          const newFiles = [...productForm.previewFiles];
                          newFiles[index] = {
                            ...file,
                            fileSize: parseInt(e.target.value),
                          };
                          setProductForm({
                            ...productForm,
                            previewFiles: newFiles,
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductForm((prev) => ({
                            ...prev,
                            previewFiles: prev.previewFiles.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*,application/pdf,text/plain,application/json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("file", file);
                      try {
                        const res = await fetch("/api/files/upload", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();
                        if (data.success) {
                          setProductForm((prev) => ({
                            ...prev,
                            previewFiles: [
                              ...(Array.isArray(prev.previewFiles)
                                ? prev.previewFiles
                                : []),
                              {
                                fileName: data.data.originalName,
                                fileUrl: data.data.fileKey,
                                fileSize: data.data.size,
                              },
                            ],
                          }));
                        } else {
                          alert(data.error || "File upload failed");
                        }
                      } catch (err) {
                        alert("File upload failed");
                      }
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  External Links
                </label>
                <div className="space-y-2">
                  {productForm.externalLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Link name"
                        className="p-2 border border-gray-300 rounded-md"
                        value={link.name}
                        onChange={(e) => {
                          const newLinks = [...productForm.externalLinks];
                          newLinks[index] = { ...link, name: e.target.value };
                          setProductForm({
                            ...productForm,
                            externalLinks: newLinks,
                          });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="URL"
                        className="p-2 border border-gray-300 rounded-md"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...productForm.externalLinks];
                          newLinks[index] = { ...link, url: e.target.value };
                          setProductForm({
                            ...productForm,
                            externalLinks: newLinks,
                          });
                        }}
                      />
                      <select
                        className="p-2 border border-gray-300 rounded-md"
                        value={link.type}
                        onChange={(e) => {
                          const newLinks = [...productForm.externalLinks];
                          newLinks[index] = { ...link, type: e.target.value };
                          setProductForm({
                            ...productForm,
                            externalLinks: newLinks,
                          });
                        }}
                      >
                        <option value="figma">Figma</option>
                        <option value="notion">Notion</option>
                        <option value="behance">Behance</option>
                        <option value="github">GitHub</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                  Preview Links
                </label>
                <div className="space-y-2">
                  {productForm.previewLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Link name"
                        className="p-2 border border-gray-300 rounded-md"
                        value={link.name}
                        onChange={(e) => {
                          const newLinks = [...productForm.previewLinks];
                          newLinks[index] = { ...link, name: e.target.value };
                          setProductForm({
                            ...productForm,
                            previewLinks: newLinks,
                          });
                        }}
                      />
                      <input
                        type="text"
                        placeholder="URL"
                        className="p-2 border border-gray-300 rounded-md"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...productForm.previewLinks];
                          newLinks[index] = { ...link, url: e.target.value };
                          setProductForm({
                            ...productForm,
                            previewLinks: newLinks,
                          });
                        }}
                      />
                      <select
                        className="p-2 border border-gray-300 rounded-md"
                        value={link.type}
                        onChange={(e) => {
                          const newLinks = [...productForm.previewLinks];
                          newLinks[index] = { ...link, type: e.target.value };
                          setProductForm({
                            ...productForm,
                            previewLinks: newLinks,
                          });
                        }}
                      >
                        <option value="figma">Figma</option>
                        <option value="notion">Notion</option>
                        <option value="behance">Behance</option>
                        <option value="github">GitHub</option>
                        <option value="other">Other</option>
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductForm((prev) => ({
                            ...prev,
                            previewLinks: prev.previewLinks.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductForm((prev) => ({
                        ...prev,
                        previewLinks: [
                          ...(Array.isArray(prev.previewLinks)
                            ? prev.previewLinks
                            : []),
                          { name: "", url: "", type: "other" },
                        ],
                      }));
                    }}
                  >
                    Add Preview Link
                  </Button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Discount Percentage (optional)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={productForm.discountPercentage || ""}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  discountPercentage: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={autopublish}
                onChange={(e) => setAutopublish(e.target.checked)}
              />
              Autopublish (publish immediately after creation)
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={() => setShowProductForm(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={testCreateProduct} disabled={isRunning}>
            Create Product
          </Button>
        </div>
      </div>
    </div>
  );

  // Form component for product update
  const UpdateForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">
          Update Product - Customize Data
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={updateForm.name}
              onChange={(e) =>
                setUpdateForm({ ...updateForm, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md h-20"
              value={updateForm.description}
              onChange={(e) =>
                setUpdateForm({ ...updateForm, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={updateForm.price}
              onChange={(e) =>
                setUpdateForm({
                  ...updateForm,
                  price: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={
                Array.isArray(updateForm.tags)
                  ? updateForm.tags.join(", ")
                  : updateForm.tags
              }
              onChange={(e) =>
                setUpdateForm({
                  ...updateForm,
                  tags: e.target.value.split(",").map((t) => t.trim()),
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={() => setShowUpdateForm(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={testUpdateProduct} disabled={isRunning}>
            Update Product
          </Button>
        </div>
      </div>
    </div>
  );

  // Form component for comment
  const CommentForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Add Comment - Customize Data</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Comment Text</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md h-24"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment..."
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={() => setShowCommentForm(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={testAddProductComment} disabled={isRunning}>
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  );

  // Form component for rating
  const RatingForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Add Rating - Customize Data</h3>

        <div>
          <label className="block text-sm font-medium mb-1">
            Rating (1-5 stars)
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={ratingValue}
            onChange={(e) => setRatingValue(parseInt(e.target.value))}
          >
            <option value={1}>1 Star</option>
            <option value={2}>2 Stars</option>
            <option value={3}>3 Stars</option>
            <option value={4}>4 Stars</option>
            <option value={5}>5 Stars</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={() => setShowRatingForm(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={testAddProductRating} disabled={isRunning}>
            Add Rating
          </Button>
        </div>
      </div>
    </div>
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProductForm((prev) => ({
          ...prev,
          digitalFiles: [
            ...(Array.isArray(prev.digitalFiles) ? prev.digitalFiles : []),
            {
              fileName: data.data.originalName,
              fileUrl: data.data.fileKey,
              fileSize: data.data.size,
            },
          ],
        }));
      } else {
        alert(data.error || "File upload failed");
      }
    } catch (err) {
      alert("File upload failed");
    }
  };

  const handleRemoveFile = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      digitalFiles: prev.digitalFiles.filter(
        (_: any, i: number) => i !== index
      ),
    }));
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
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
                {getCurrentProductId() && (
                  <p>
                    <strong>Active Product ID:</strong> {getCurrentProductId()}
                    {manualProductId.trim() ? " (manual)" : " (auto-generated)"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Test Suite Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? "Running..." : "Run All User Tests"}
            </Button>
            <Button
              onClick={runAllProductTests}
              disabled={isRunning}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isRunning ? "Running..." : "Run All Product Tests"}
            </Button>
            <Button
              onClick={runPublicProductTests}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              Public Product Tests
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

          {/* User API Individual Tests */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">👤 User API Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button onClick={testGetMe} disabled={isRunning} size="sm">
                GET /users/me
              </Button>
              <Button onClick={testUpdateMe} disabled={isRunning} size="sm">
                PUT /users/me
              </Button>
              <Button
                onClick={testUpdateFarcaster}
                disabled={isRunning}
                size="sm"
              >
                PUT /users/me/farcaster
              </Button>
              <Button onClick={testAddWallet} disabled={isRunning} size="sm">
                POST /users/me/wallet
              </Button>
              <Button onClick={testRemoveWallet} disabled={isRunning} size="sm">
                DELETE /users/me/wallet
              </Button>
              <Button onClick={testRegisterUser} disabled={isRunning} size="sm">
                POST /users/register
              </Button>
            </div>
          </div>

          {/* Product API Individual Tests */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🛍️ Product API Tests</h3>

            {/* Manual Product ID Input */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                💡 Manual Product ID Override
              </h4>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter product ID to test specific product..."
                    className="w-full p-2 border border-blue-300 rounded-md text-sm"
                    value={manualProductId}
                    onChange={(e) => setManualProductId(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => setManualProductId("")}
                  size="sm"
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  Clear
                </Button>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                <strong>Active Product ID:</strong>{" "}
                {getCurrentProductId() || "None"}
                {manualProductId.trim() && " (manual override)"}
                {!manualProductId.trim() &&
                  createdProductId &&
                  " (auto-generated)"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={() => setShowProductForm(true)}
                disabled={isRunning}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                🔒 CREATE Product
              </Button>
              <Button
                onClick={testGetProducts}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                🌍 GET Products
              </Button>
              <Button
                onClick={testSearchProducts}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                🌍 SEARCH Products
              </Button>
              <Button
                onClick={testGetCategories}
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                🌍 GET Categories
              </Button>
              <Button
                onClick={testGetMyProducts}
                disabled={isRunning}
                size="sm"
              >
                🔒 GET My Products
              </Button>
              <Button
                onClick={testGetProductById}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
                variant="outline"
              >
                🌍 GET Product by ID
              </Button>
              <Button
                onClick={() => setShowUpdateForm(true)}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
              >
                🔒 UPDATE Product
              </Button>
              <Button
                onClick={testPublishProduct}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
              >
                🔒 PUBLISH Product
              </Button>
              <Button
                onClick={testUnpublishProduct}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
              >
                🔒 UNPUBLISH Product
              </Button>
              <Button
                onClick={testGetProductComments}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
                variant="outline"
              >
                🌍 GET Comments
              </Button>
              <Button
                onClick={() => setShowCommentForm(true)}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
              >
                🔒 ADD Comment
              </Button>
              <Button
                onClick={testGetProductRatings}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
                variant="outline"
              >
                🌍 GET Ratings
              </Button>
              <Button
                onClick={() => setShowRatingForm(true)}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
              >
                🔒 ADD Rating
              </Button>
              <Button
                onClick={testDeleteProduct}
                disabled={isRunning || !getCurrentProductId()}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                🔒 DELETE Product
              </Button>
              <Button
                onClick={initiateBuy}
                disabled={
                  isRunning ||
                  !getCurrentProductId() ||
                  !isConnected ||
                  buyLoading ||
                  buyStep !== "init"
                }
                size="sm"
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                🛒 Buy Product (Onchain)
              </Button>
            </div>

            {/* Buy Product Flow UI */}
            {(buyStep !== "init" || buyLoading || buyError) && (
              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200 max-w-xl">
                {/* Approve USDC Button (before sign/send) */}
                {buyStep === "signing" && (
                  <div className="mb-2 flex flex-col gap-2">
                    <Button
                      onClick={handleApproveUSDC}
                      disabled={approveLoading}
                      variant="outline"
                      className="w-fit"
                    >
                      {approveLoading
                        ? "Approving..."
                        : "Approve USDC for Farfield"}
                    </Button>
                    {approveError && (
                      <div className="text-red-600 text-xs">{approveError}</div>
                    )}
                    {approveSuccess && (
                      <div className="text-green-700 text-xs break-all">
                        Approved! Tx: {approveSuccess}
                      </div>
                    )}
                  </div>
                )}
                {buyStep === "signing" && buyTxs.length > 0 && (
                  <Button
                    onClick={executeBuyTxs}
                    disabled={buyLoading}
                    className="mb-2"
                  >
                    Sign & Send Transactions
                  </Button>
                )}
                {buyStep === "confirming" && buyFinalTxHash && (
                  <Button
                    onClick={confirmBuy}
                    disabled={buyLoading}
                    className="mb-2"
                  >
                    Confirm Purchase
                  </Button>
                )}
                {buyError && (
                  <div className="text-red-600 my-2">{buyError}</div>
                )}
                {buyStep === "done" && (
                  <>
                    <div className="text-green-700 font-bold">
                      Purchase complete!
                    </div>
                    {/* Fetch product access if not already fetched for this product */}
                    {buyPurchaseId &&
                      getCurrentProductId() &&
                      (!productAccess ||
                        productAccess.productId !== getCurrentProductId()) && (
                        <Button
                          onClick={fetchProductAccess}
                          className="mt-2"
                          variant="outline"
                        >
                          Check Product Access
                        </Button>
                      )}
                    {/* Show download buttons or links if access is available */}
                    {productAccess &&
                      productAccess.hasAccess &&
                      productAccess.productId === getCurrentProductId() && (
                        <div className="mt-4">
                          {/* Product Images */}
                          {imageUrls.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto mb-4">
                              {imageUrls.map((url, idx) =>
                                url ? (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`Product image ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                                  />
                                ) : null
                              )}
                            </div>
                          )}
                          {productAccess.previewFiles &&
                            productAccess.previewFiles.length > 0 && (
                              <div className="space-y-2">
                                <div className="font-semibold text-sm">
                                  Preview Files:
                                </div>
                                {productAccess.previewFiles.map(
                                  (file: any, idx: number) => (
                                    <Button
                                      key={idx}
                                      variant="secondary"
                                      className="mt-1"
                                      onClick={() =>
                                        handleAuthenticatedDownload(file)
                                      }
                                    >
                                      Download Preview {file.fileName} (
                                      {file.fileSize} bytes)
                                    </Button>
                                  )
                                )}
                              </div>
                            )}
                          {productAccess.previewLinks &&
                            productAccess.previewLinks.length > 0 && (
                              <div className="space-y-2">
                                <div className="font-semibold text-sm">
                                  Preview Links:
                                </div>
                                {productAccess.previewLinks.map(
                                  (link: any, idx: number) => (
                                    <a
                                      key={idx}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 underline mt-1"
                                    >
                                      {link.name} ({link.type})
                                    </a>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            {/* Purchase History & Product Access */}
            <div className="mt-6 flex flex-col gap-4">
              {/* Purchase History */}
              <div>
                <Button
                  onClick={fetchPurchaseHistory}
                  disabled={historyLoading}
                  variant="outline"
                >
                  {historyLoading ? "Loading..." : "Get My Purchased Products"}
                </Button>
                {historyError && (
                  <div className="text-red-600 text-xs mt-1">
                    {historyError}
                  </div>
                )}
                {purchaseHistory && (
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(purchaseHistory, null, 2)}
                  </pre>
                )}
              </div>
              {/* Product Access */}
              <div>
                <Button
                  onClick={fetchProductAccess}
                  disabled={accessLoading || !getCurrentProductId()}
                  variant="outline"
                >
                  {accessLoading
                    ? "Loading..."
                    : "Check Product Access (Current ID)"}
                </Button>
                {accessError && (
                  <div className="text-red-600 text-xs mt-1">{accessError}</div>
                )}
                {productAccess && (
                  <div className="mt-8 flex justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xl border border-gray-200">
                      {/* Product Image */}
                      {imageUrls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto mb-4">
                          {imageUrls.map((url, idx) =>
                            url ? (
                              <img
                                key={idx}
                                src={url}
                                alt={`Product image ${idx + 1}`}
                                className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                              />
                            ) : null
                          )}
                        </div>
                      )}
                      {/* Product Title & Description */}
                      <h2 className="text-2xl font-bold mb-2">
                        {productAccess.productTitle}
                      </h2>
                      <div className="text-gray-600 mb-4">
                        Product ID: {productAccess.productId}
                      </div>
                      {/* Preview Files */}
                      {productAccess.previewFiles &&
                        productAccess.previewFiles.length > 0 && (
                          <div className="mb-4">
                            <div className="font-semibold text-sm mb-1">
                              Preview Files:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productAccess.previewFiles.map(
                                (file: any, idx: number) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleAuthenticatedDownload(file)
                                    }
                                  >
                                    Download Preview {file.fileName}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {/* Preview Links */}
                      {productAccess.previewLinks &&
                        productAccess.previewLinks.length > 0 && (
                          <div className="mb-4">
                            <div className="font-semibold text-sm mb-1">
                              Preview Links:
                            </div>
                            <div className="flex flex-col gap-1">
                              {productAccess.previewLinks.map(
                                (link: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    {link.name} ({link.type})
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {/* Digital Files */}
                      {productAccess.downloadUrls &&
                        productAccess.downloadUrls.length > 0 && (
                          <div className="mb-4">
                            <div className="font-semibold text-sm mb-1">
                              Digital Files:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {productAccess.downloadUrls.map(
                                (file: any, idx: number) => (
                                  <Button
                                    key={idx}
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      handleAuthenticatedDownload(file)
                                    }
                                  >
                                    Download {file.fileName}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {/* External Links */}
                      {productAccess.externalLinks &&
                        productAccess.externalLinks.length > 0 && (
                          <div className="mb-4">
                            <div className="font-semibold text-sm mb-1">
                              External Links:
                            </div>
                            <div className="flex flex-col gap-1">
                              {productAccess.externalLinks.map(
                                (link: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    {link.name} ({link.type})
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {/* Access Info */}
                      <div className="text-xs text-gray-500 mt-2">
                        <div>
                          Access:{" "}
                          {productAccess.hasAccess ? "Granted" : "Denied"}
                        </div>
                        <div>
                          Creator: {productAccess.isCreator ? "Yes" : "No"}
                        </div>
                        <div>
                          Purchased: {productAccess.hasPurchased ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Render Forms */}
        {showProductForm && <ProductForm />}
        {showUpdateForm && <UpdateForm />}
        {showCommentForm && <CommentForm />}
        {showRatingForm && <RatingForm />}

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
          <h2 className="text-xl font-bold mb-4">📋 Instructions</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>🔒 Protected Endpoints:</strong> Require Privy
              authentication (creator-only operations)
            </p>
            <p>
              <strong>🌍 Public Endpoints:</strong> No authentication needed
              (browsing, search, viewing)
            </p>
            <p>
              <strong>⚠️ Expected Errors:</strong> Some tests may fail if user
              already exists, tries to rate own product, or lacks permissions
            </p>
            <p>
              <strong>🛍️ Product Test Flow:</strong> Click buttons with forms to
              customize test data before sending
            </p>
            <p>
              <strong>📝 Customizable Tests:</strong> CREATE Product, UPDATE
              Product, ADD Comment, and ADD Rating now have input forms
            </p>
            <p>
              <strong>💡 Manual Product ID:</strong> Enter any product ID in the
              blue input field to test endpoints with existing products
            </p>
            <p>
              <strong>🎯 Test Coverage:</strong> All Phase 1 product endpoints
              are covered - CRUD, search, comments, ratings, publishing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
