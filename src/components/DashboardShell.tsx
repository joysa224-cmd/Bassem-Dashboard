"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useData } from "@/components/DataProvider";
import { ColumnMappingScreen } from "@/components/ColumnMappingScreen";
import { CategoryMappingScreen } from "@/components/CategoryMappingScreen";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { stage } = useData();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-gray-900">Modern Travel</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {stage === "mapping-columns" && <ColumnMappingScreen />}
          {stage === "mapping-categories" && <CategoryMappingScreen />}
          {stage !== "mapping-columns" && stage !== "mapping-categories" && children}
        </main>
      </div>
    </div>
  );
}
