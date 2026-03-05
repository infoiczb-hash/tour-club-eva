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

// Провайдер управляет стейтом
export function KayakingTabProvider({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState<FlowTab>("newbie");
    return <TabContext.Provider value={{ activeTab, setActiveTab }}>{children}</TabContext.Provider>;
}

// Этот компонент принимает СЕРВЕРНЫЕ блоки как children и рендерит их по условию
export function KayakingTabContent({ value, children }: { value: FlowTab, children: React.ReactNode }) {
    const { activeTab } = useKayakTab();
    if (activeTab !== value) return null;
    return <div className="animate-in fade-in duration-700">{children}</div>;
}