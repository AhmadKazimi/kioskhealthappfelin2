"use client";

import { Suspense } from "react";
import HomeInner from "../../components/home-screen";
import { useTranslation } from "@/hooks/useTranslation";

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <Suspense fallback={<div>{t('common.loading')}</div>}>
      <HomeInner />
    </Suspense>
  );
} 