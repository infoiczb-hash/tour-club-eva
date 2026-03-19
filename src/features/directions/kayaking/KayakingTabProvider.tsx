"use client";

import React, { createContext, useContext, useState } from 'react';

export type FlowTab = "newbie" | "participant";

const TabContext = createContext<{
  activeTab: FlowTab;
  setActiveTab: (tab: FlowTab) => void;
} | null>(null);

export const useKayakTab = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("useKayakTab must be used within KayakingTabProvider");
  return context;
};

export function KayakingTabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<FlowTab>("newbie");
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}

// Было: return null — при переключении монтировало кучу компонентов → тяжёлый INP
// Стало: hidden div — DOM готов сразу, переключение мгновенное
export function KayakingTabContent({
  value,
  children,
}: {
  value: FlowTab;
  children: React.ReactNode;
}) {
  const { activeTab } = useKayakTab();
  const isActive = activeTab === value;

  return (
    <div
      className={isActive ? "animate-in fade-in duration-700" : "hidden"}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}