// src/hooks/useApi.js
import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useApi() {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  return { call, loading, error };
}
