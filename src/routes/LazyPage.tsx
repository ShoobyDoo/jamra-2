import React, { Suspense } from "react";
import { PageLoader } from "./PageLoader";

interface LazyPageProps {
  children: React.ReactNode;
}

// Wrapper for lazy-loaded components with Suspense
export const LazyPage: React.FC<LazyPageProps> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);
