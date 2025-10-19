import { useState, useEffect, useMemo } from 'react';
import { Country } from '@/payload-types';

// Singleton state - shared across all component instances
let globalCountries: Country[] = [];
let globalIsLoading = false;
let globalError: string | null = null;
const listeners = new Set<() => void>();
let fetchPromise: Promise<void> | null = null;

// Notify all listeners when state changes
function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>(globalCountries);
  const [isLoading, setIsLoading] = useState(globalIsLoading);
  const [error, setError] = useState<string | null>(globalError);

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL, []);

  useEffect(() => {
    // Subscribe to global state changes
    const updateState = () => {
      setCountries(globalCountries);
      setIsLoading(globalIsLoading);
      setError(globalError);
    };

    listeners.add(updateState);

    // Fetch if not already fetched or fetching
    if (globalCountries.length === 0 && !globalIsLoading && !fetchPromise && apiUrl) {
      globalIsLoading = true;
      notifyListeners();

      fetchPromise = (async () => {
        try {
          const response = await fetch(`${apiUrl}/Common/GetCountries`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          });

          const responseJson = await response.json();

          if (!responseJson.IsSuccess) {
            throw new Error('Failed to fetch countries');
          }

          globalCountries = responseJson.Result.filter((country: Country) => country.Id !== 0);
          globalIsLoading = false;
          globalError = null;
          notifyListeners();
        } catch (err) {
          globalError = err instanceof Error ? err.message : 'Unknown error';
          globalIsLoading = false;
          notifyListeners();
          console.error('Error fetching countries:', err);
        } finally {
          fetchPromise = null;
        }
      })();
    }

    return () => {
      listeners.delete(updateState);
    };
  }, [apiUrl]);

  return { countries, isLoading, error };
}
