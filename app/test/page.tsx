"use client";

import { usePrivy } from "@privy-io/react-auth";
import {
  useAuthenticatedAPI,
  useAuthenticatedFetch,
} from "@/lib/hooks/use-authenticated-fetch";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
  tags: string[] | string;
  fileFormat: string[] | string;
  discountPercentage?: number;
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

  // Form data states
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: "Test Product",
    description:
      "This is a test product created from the API test page. It includes comprehensive testing data to validate all product creation functionality.",
    price: 29.99,
    category: "Design",
    hasExternalLinks: false,
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
    digitalFiles: [
      {
        fileName: "test-file.pdf",
        fileUrl: "https://example.com/files/test-file.pdf",
        fileSize: 1024000,
      },
    ],
    externalLinks: [
      {
        name: "Figma File",
        url: "https://figma.com/file/example",
        type: "figma",
      },
    ],
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

    // Clean up payload based on hasExternalLinks
    const payload = basePayload.hasExternalLinks
      ? {
          ...basePayload,
          digitalFiles: undefined,
          externalLinks: basePayload.externalLinks,
        }
      : {
          ...basePayload,
          externalLinks: undefined,
          digitalFiles: basePayload.digitalFiles,
        };

    const result = await runTest(
      "POST /api/products",
      () => post("/api/products", payload),
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
              Images (comma-separated URLs)
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={
                Array.isArray(productForm.images)
                  ? productForm.images.join(", ")
                  : productForm.images
              }
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  images: e.target.value.split(",").map((i) => i.trim()),
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Digital Files
              </label>
              <div className="space-y-2">
                {productForm.digitalFiles.map((file, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="File name"
                      className="p-2 border border-gray-300 rounded-md"
                      value={file.fileName}
                      onChange={(e) => {
                        const newFiles = [...productForm.digitalFiles];
                        newFiles[index] = { ...file, fileName: e.target.value };
                        setProductForm({
                          ...productForm,
                          digitalFiles: newFiles,
                        });
                      }}
                    />
                    <input
                      type="text"
                      placeholder="File URL"
                      className="p-2 border border-gray-300 rounded-md"
                      value={file.fileUrl}
                      onChange={(e) => {
                        const newFiles = [...productForm.digitalFiles];
                        newFiles[index] = { ...file, fileUrl: e.target.value };
                        setProductForm({
                          ...productForm,
                          digitalFiles: newFiles,
                        });
                      }}
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
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
