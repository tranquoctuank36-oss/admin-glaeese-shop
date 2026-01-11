"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { getFrameCounts, getTrashFrameCounts } from "@/services/frameService/frameCommon";

interface FrameCounts {
  frameShapes: number;
  frameTypes: number;
  frameMaterials: number;
}

interface FrameCountsContextType {
  tabCounts: FrameCounts;
  trashCounts: FrameCounts;
  isLoading: boolean;
  refreshCounts: (forceRefresh?: boolean) => Promise<void>;
}

const FrameCountsContext = createContext<FrameCountsContextType | undefined>(undefined);

export function FrameCountsProvider({ children }: { children: ReactNode }) {
  const [tabCounts, setTabCounts] = useState<FrameCounts>({
    frameShapes: 0,
    frameTypes: 0,
    frameMaterials: 0,
  });
  
  const [trashCounts, setTrashCounts] = useState<FrameCounts>({
    frameShapes: 0,
    frameTypes: 0,
    frameMaterials: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<{ timestamp: number; data: any } | null>(null);
  const CACHE_DURATION = 300000; // 5 minutes

  const refreshCounts = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
      setTabCounts(cacheRef.current.data.active);
      setTrashCounts(cacheRef.current.data.trash);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      const [activeCounts, trashCountsData] = await Promise.all([
        getFrameCounts(),
        getTrashFrameCounts(),
      ]);
      
      setTabCounts(activeCounts);
      setTrashCounts(trashCountsData);
      cacheRef.current = {
        timestamp: Date.now(),
        data: { active: activeCounts, trash: trashCountsData }
      };
    } catch (e: any) {
      if (e.name !== 'AbortError' && e.name !== 'CanceledError') {
        console.error("Failed to fetch frame counts:", e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <FrameCountsContext.Provider value={{ tabCounts, trashCounts, isLoading, refreshCounts }}>
      {children}
    </FrameCountsContext.Provider>
  );
}

export function useFrameCounts() {
  const context = useContext(FrameCountsContext);
  if (context === undefined) {
    throw new Error("useFrameCounts must be used within a FrameCountsProvider");
  }
  return context;
}
