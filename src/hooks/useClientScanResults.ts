import { useState, useEffect, useRef, useCallback } from 'react';
import { HealthData } from '@/types/health-data';
import { ClientModel } from '@/payload-types';
import Cookies from 'js-cookie';

interface UseClientScanResultsOptions {
  enabled?: boolean;
  onSuccess?: (data: HealthData) => void;
  onError?: (error: Error) => void;
}

interface UseClientScanResultsReturn {
  data: HealthData | null;
  client: ClientModel | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const cache = new Map<string, { data: HealthData; client: ClientModel; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useClientScanResults(options: UseClientScanResultsOptions = {}): UseClientScanResultsReturn {
  const { enabled = true, onSuccess, onError } = options;

  const [data, setData] = useState<HealthData | null>(null);
  const [client, setClient] = useState<ClientModel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchData = useCallback(async () => {
    const userId = Cookies.get('userId');
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!userId || !apiUrl || !enabled) {
      return;
    }

    // Check cache first
    const cacheKey = `${userId}_scan_results`;
    const cachedEntry = cache.get(cacheKey);

    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
      if (isMountedRef.current) {
        setData(cachedEntry.data);
        setClient(cachedEntry.client);
        setLoading(false);
        setError(null);
        onSuccess?.(cachedEntry.data);
      }
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Fetch client data
      const clientResponse = await fetch(`${apiUrl}/client/GetClient?id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        signal,
      });

      if (!clientResponse.ok) {
        throw new Error(`Client API failed with status: ${clientResponse.status}`);
      }

      const clientResponseJson = await clientResponse.json();
      const clientData: ClientModel = clientResponseJson.Result;

      // Fetch scan results
      const scanResultsResponse = await fetch(`${apiUrl}/ScanResult/GetClientLatestScanResult?clientId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        signal,
      });

      if (!scanResultsResponse.ok) {
        throw new Error(`Scan results API failed with status: ${scanResultsResponse.status}`);
      }

      const scanResultsJson = await scanResultsResponse.json();
      const scanData: HealthData = scanResultsJson.Result;

      if (isMountedRef.current) {
        setData(scanData);
        setClient(clientData);
        setLoading(false);
        setError(null);

        // Cache the results
        cache.set(cacheKey, {
          data: scanData,
          client: clientData,
          timestamp: Date.now(),
        });

        onSuccess?.(scanData);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }

      const error = err instanceof Error ? err : new Error('Unknown error occurred');

      if (isMountedRef.current) {
        setError(error);
        setLoading(false);
        onError?.(error);
      }

      console.error('Error fetching scan results:', error);
    }
  }, [enabled, onSuccess, onError]);

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    // Clear cache for this user
    const userId = Cookies.get('userId');
    if (userId) {
      const cacheKey = `${userId}_scan_results`;
      cache.delete(cacheKey);
    }

    await fetchData();
  }, [fetchData, enabled]);

  return {
    data,
    client,
    loading,
    error,
    refetch,
  };
}