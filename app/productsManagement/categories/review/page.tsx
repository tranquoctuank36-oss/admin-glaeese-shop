"use client";

import { JSX, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { CategoryTree, getCategoriesTree } from "@/services/categoryService";

type DepthFilter = `${number}`;
type CategoryStatusOption = "all" | "draft" | "published" | "unpublished";
type SortField = "priority" | "createdAt" | "name" | "level";
type SortOrder = "ASC" | "DESC";

export default function CategoriesReviewPage() {
  const router = useRouter();

  const [depth, setDepth] = useState<DepthFilter | undefined>(undefined);
  const [maxDepth, setMaxDepth] = useState<number>(0);

  const [status, setStatus] = useState<CategoryStatusOption>("all");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortOrder, setSortOrder] = useState<SortOrder>("ASC");

  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const norm = (s?: string | null) =>
    (s ?? "").toLowerCase() as "draft" | "published" | "unpublished" | "";

  const cmp = (a: any, b: any) => {
    let va = a?.[sortField];
    let vb = b?.[sortField];
    if (sortField === "name") {
      va = String(va ?? "").toLowerCase();
      vb = String(vb ?? "").toLowerCase();
    } else if (sortField === "createdAt") {
      va = va ? new Date(va).getTime() : 0;
      vb = vb ? new Date(vb).getTime() : 0;
    } else {
      va = Number(va ?? 0);
      vb = Number(vb ?? 0);
    }
    const base = va < vb ? -1 : va > vb ? 1 : 0;
    return sortOrder === "ASC" ? base : -base;
  };

  const collectLevels = (nodes: CategoryTree[]): number[] =>
    nodes.flatMap((n) => [
      Number(n.level ?? 0),
      ...(n.children?.length ? collectLevels(n.children) : []),
    ]);

  const pruneByStatus = (
    nodes: CategoryTree[],
    statusFilter: CategoryStatusOption
  ): CategoryTree[] => {
    if (statusFilter === "all") return nodes;
    const want = statusFilter;
    const recurse = (n: CategoryTree): CategoryTree | null => {
      const children = (n.children ?? [])
        .map(recurse)
        .filter(Boolean) as CategoryTree[];

      const matchSelf = norm(n.categoryStatus) === want;
      if (matchSelf || children.length > 0) {
        // return shallow clone with pruned children
        return { ...n, children };
      }
      return null;
    };
    return nodes.map(recurse).filter(Boolean) as CategoryTree[];
  };

  // ---------- initial load: fetch depth 5 to discover up to 5 levels ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // request depth=5 (cap)
        const res = await getCategoriesTree({
          depth: "5",
          sortField: "priority",
          sortOrder: "ASC",
        });
        if (!alive) return;
        const rows = res.data ?? [];
        // compute max depth found but cap at 5
        const levels = collectLevels(rows);
        const computedMax = levels.length ? Math.max(...levels) : 0;
        const cappedMax = Math.min(5, Math.max(0, computedMax));
        setMaxDepth(cappedMax);

        // default depth to the deepest found (capped) if not set
        setDepth((d) =>
          typeof d === "undefined" ? (`${cappedMax}` as DepthFilter) : d
        );
        setTree(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---------- refetch when depth or sortField/order change ----------
  // We fetch tree up to requested depth to ensure nested children data exists.
  useEffect(() => {
    // if depth not set yet, nothing to do
    if (typeof depth === "undefined") return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // request tree up to requested depth (cap at 5)
        const requested = Math.min(5, Math.max(0, Number(depth)));
        const res = await getCategoriesTree({
          depth: `${requested}`,
          sortField,
          sortOrder,
        });
        if (!alive) return;
        const rows = res.data ?? [];
        // recalc maxDepth from returned rows but cap at 5; only increase maxDepth if bigger
        const levels = collectLevels(rows);
        const computedMax = levels.length ? Math.max(...levels) : 0;
        const cappedMax = Math.min(5, Math.max(0, computedMax));
        setMaxDepth((prev) => Math.max(prev ?? 0, cappedMax));
        // if current depth > cappedMax, clamp it
        if (Number(depth) > cappedMax) {
          setDepth(`${cappedMax}` as DepthFilter);
        }
        setTree(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [depth, sortField, sortOrder]);

  // depth options (0 .. maxDepth)
  const depthOptions: DepthFilter[] = Array.from(
    { length: maxDepth + 1 },
    (_, i) => `${i}` as DepthFilter
  );

  const prunedTree = useMemo(() => pruneByStatus(tree, status), [tree, status]);

  const displayDepth = Number(depth ?? maxDepth);

  const renderNode = (node: CategoryTree, level: number): JSX.Element => {
    const kids = (node.children ?? []).slice().sort(cmp);
    const canGoDeeper = level < displayDepth && kids.length > 0;

    return (
      <li key={node.id} className="py-1">
        <div className={level === 0 ? "font-bold" : "font-medium text-gray-700"}>
          {node.name}
        </div>
        {canGoDeeper && (
          <ul className="pl-4 mt-1 border-l border-gray-200">
            {kids.map((k) => renderNode(k, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() =>
                router.push(Routes.productsManagement.categories.root)
              }
              title="Go Back"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Categories – Tree view
              </h1>
              <p className="text-gray-600 mt-1">
                View nested tree (levels 0 → selected depth)
              </p>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-wrap items-center gap-12">
              <div className="text-base text-gray-700 font-bold">Filters:</div>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base font-medium">Depth:</span>
                <select
                  className="text-sm border rounded-md px-2 py-2 hover:cursor-pointer"
                  value={depth ?? `${maxDepth}`}
                  onChange={(e) => setDepth(e.target.value as DepthFilter)}
                >
                  {depthOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base font-medium">Status:</span>
                <select
                  className="text-sm border rounded-md px-2 py-2 hover:cursor-pointer"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as CategoryStatusOption)
                  }
                >
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </label>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base font-medium">Sort by: </span>
                <select
                  className="text-sm border rounded-md px-2 py-2 hover:cursor-pointer"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                >
                  <option value="priority">Priority</option>
                  <option value="createdAt">Created At</option>
                  <option value="name">Name</option>
                  <option value="level">Level</option>
                </select>
              </label>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base font-medium">Order:</span>
                <select
                  className="text-sm border rounded-md px-2 py-2 hover:cursor-pointer"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                >
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </select>
              </label>

              <Button
                className="ml-auto hover:bg-gray-100 text-gray-700"
                onClick={() => {
                  setDepth("5");
                  setStatus("all");
                  setSortField("priority");
                  setSortOrder("ASC");
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : prunedTree.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center text-gray-600">
            No categories to display.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {prunedTree
                .slice()
                .sort(cmp)
                .map((root) => (
                  <div key={root.id} className="min-h-[120px]">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                      {root.name}
                    </h2>
                    <ul>
                      {(root.children ?? []).length > 0 ? (
                        (root.children ?? [])
                          .slice()
                          .sort(cmp)
                          .map((c) => renderNode(c, 1))
                      ) : (
                        <li className="italic text-gray-400">
                          (No subcategories)
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
