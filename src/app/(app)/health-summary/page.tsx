// app/home/page.tsx
"use client";

import { Suspense } from "react";
import PlaygroundInner from "../../../components/health-summary-screen"; // Rename your current logic to `home-inner.tsx`
import { useTranslation } from "@/hooks/useTranslation";

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <PlaygroundInner />
    </Suspense>
  );
}
