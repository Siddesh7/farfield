"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

export function useAuthenticatedFetch() {
  const { getAccessToken, authenticated } = usePrivy();

  const authenticatedFetch = useCallback(
    async (url: string, options: FetchOptions = {}) => {
      if (!authenticated) {
        throw new Error("User is not authenticated");
      }

      try {
        // Get the access token from Privy
        const accessToken = await getAccessToken();

        // Prepare headers with authorization
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        };

        // Make the API request
        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Handle authentication errors
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Authentication failed");
        }

        return response;
      } catch (error) {
        console.error("Authenticated fetch error:", error);
        throw error;
      }
    },
    [getAccessToken, authenticated]
  );

  return {
    authenticatedFetch,
    isAuthenticated: authenticated,
  };
}

// Convenience methods for common HTTP operations
export function useAuthenticatedAPI() {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  const get = useCallback(
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: "GET" });
      return response.json();
    },
    [authenticatedFetch]
  );

  const post = useCallback(
    async (url: string, data?: any) => {
      try {
        const response = await authenticatedFetch(url, {
          method: "POST",
          body: JSON.stringify(data),
        });
        return response.json();
      } catch (error) {
        throw new Error(`Error in posting: ${error}`)
      }
    },
    [authenticatedFetch]
  );

  const put = useCallback(
    async (url: string, data?: any) => {
      const response = await authenticatedFetch(url, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    [authenticatedFetch]
  );

  const del = useCallback(
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: "DELETE" });
      return response.json();
    },
    [authenticatedFetch]
  );

  return {
    get,
    post,
    put,
    delete: del,
    isAuthenticated,
  };
}
