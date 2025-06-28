import { useState, useCallback } from "react";
import { useAuthenticatedAPI } from "./use-authenticated-fetch";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiStateReturn<T> {
  // State
  data: T | null;
  loading: boolean;
  error: string | null;

  // Actions
  execute: (apiCall: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  clearError: () => void;
}

/**
 * Standardized hook for API state management
 * Handles loading, error, and success states automatically
 */
export function useApiState<T = any>(): UseApiStateReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    clearError,
  };
}

/**
 * Pre-configured hook for user profile API calls
 */
export function useUserProfileApi() {
  const { get, put } = useAuthenticatedAPI();
  const profileState = useApiState();
  const updateState = useApiState();

  const fetchProfile = useCallback(() => {
    return profileState.execute(() => get("/api/users/me"));
  }, [profileState, get]);

  const updateProfile = useCallback(
    (data: any) => {
      return updateState.execute(() => put("/api/users/me", data));
    },
    [updateState, put]
  );

  const updateFarcaster = useCallback(
    (data: any) => {
      return updateState.execute(() => put("/api/users/me/farcaster", data));
    },
    [updateState, put]
  );

  return {
    // Profile data
    profile: profileState.data,
    profileLoading: profileState.loading,
    profileError: profileState.error,

    // Update state
    updateLoading: updateState.loading,
    updateError: updateState.error,

    // Actions
    fetchProfile,
    updateProfile,
    updateFarcaster,
    clearErrors: () => {
      profileState.clearError();
      updateState.clearError();
    },
  };
}
