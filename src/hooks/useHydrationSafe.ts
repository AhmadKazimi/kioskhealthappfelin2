import { useEffect, useState } from 'react';

export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

export function useClientOnly<T>(value: T, defaultValue: T): T {
  const [clientValue, setClientValue] = useState(defaultValue);
  const isHydrated = useHydrationSafe();

  useEffect(() => {
    setClientValue(value);
  }, [value]);

  return isHydrated ? clientValue : defaultValue;
} 