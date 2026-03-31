"use client";

import dynamic from "next/dynamic";

const GlobalModals = dynamic(() => import("@/components/modals/GlobalModals"), { ssr: false });
const AxeReporter = dynamic(() => import("@/components/AxeReporter"), { ssr: false });

export default function ModalsWrapper() {
  return (
    <>
      <GlobalModals />
      <AxeReporter />
    </>
  );
}
