"use client";

import { useRouter, usePathname } from "next/navigation";
import { Routes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { getFrameCounts, getTrashFrameCounts } from "@/services/frameService/frameCommon";

export default function FrameTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const [tabCounts, setTabCounts] = useState({
    frameShapes: 0,
    frameTypes: 0,
    frameMaterials: 0,
  });
  
  const [trashCounts, setTrashCounts] = useState({
    frameShapes: 0,
    frameTypes: 0,
    frameMaterials: 0,
  });

  // Fetch tab counts
  useEffect(() => {
    (async () => {
      try {
        const [activeCounts, trashCounts] = await Promise.all([
          getFrameCounts(),
          getTrashFrameCounts(),
        ]);
        setTabCounts(activeCounts);
        setTrashCounts(trashCounts);
      } catch (e) {
        console.error("Failed to fetch frame counts:", e);
      }
    })();
  }, [pathname]);

  const tabs = [
    {
      label: "Hình dạng gọng",
      count: tabCounts.frameShapes,
      trashCount: trashCounts.frameShapes,
      path: Routes.attributes.frames.frameShapes.root,
      trashPath: Routes.attributes.frames.frameShapes.trash,
    },
    {
      label: "Loại gọng",
      count: tabCounts.frameTypes,
      trashCount: trashCounts.frameTypes,
      path: Routes.attributes.frames.frameTypes.root,
      trashPath: Routes.attributes.frames.frameTypes.trash,
    },
    {
      label: "Chất liệu gọng",
      count: tabCounts.frameMaterials,
      trashCount: trashCounts.frameMaterials,
      path: Routes.attributes.frames.frameMaterials.root,
      trashPath: Routes.attributes.frames.frameMaterials.trash,
    },
  ];

  return (
    <div className="mb-6 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="flex gap-10 border-b border-gray-200">
        {tabs.map((tab) => {
          const isMainTabActive = pathname === tab.path;
          const isTrashTabActive = pathname === tab.trashPath;
          
          return (
            <div key={tab.path} className="flex items-center">
              {/* Main Tab */}
              <button
                onClick={() => router.push(tab.path)}
                className={`px-3 py-3 text-sm font-medium transition-colors relative cursor-pointer ${
                  isMainTabActive
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}{" "}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      isMainTabActive
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>

              {/* Separator and Trash Tab */}
              {tab.trashCount > 0 && (
                <>
                  <span className="text-gray-400 text-sm font-medium">/</span>
                  <button
                    onClick={() => router.push(tab.trashPath)}
                    className={`px-3 py-3 text-sm font-medium transition-colors relative cursor-pointer ${
                      isTrashTabActive
                        ? "text-red-600 border-b-2 border-red-600"
                        : "text-gray-600 hover:text-gray-700"
                    }`}
                  >
                    Thùng rác{" "}
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        isTrashTabActive
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.trashCount}
                    </span>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
