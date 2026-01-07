"use client";

import { JSX, useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { CategoryTree, getCategoriesTree } from "@/services/categoryService";

type DepthFilter = `${number}`;
type CategoryStatusOption = "all" | "draft" | "published" | "unpublished";
type SortField = "priority" | "createdAt" | "name" | "level";
type SortOrder = "ASC" | "DESC";

// Custom Select Component
interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`text-sm px-3 py-2 text-left bg-white border rounded-lg cursor-pointer transition-all flex items-center justify-between min-w-[120px] ${
          open ? "border-2 border-blue-400" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className="text-sm text-gray-900">
          {selectedOption ? selectedOption.label : "Chọn..."}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ml-2 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
                option.value === value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
              onClick={() => router.back()}
              title="Quay lại"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Danh mục – Xem dạng cây
              </h1>
              <p className="text-gray-600 mt-1">
                Xem cây lồng nhau (cấp 0 → cấp được chọn)
              </p>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-base text-gray-700 font-bold">Bộ lọc:</div>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base">Cấp độ:</span>
                <CustomSelect
                  value={depth ?? `${maxDepth}`}
                  onChange={(v) => setDepth(v as DepthFilter)}
                  options={depthOptions.map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                />
              </label>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base">Trạng thái:</span>
                <CustomSelect
                  value={status}
                  onChange={(v) => setStatus(v as CategoryStatusOption)}
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "published", label: "Đã xuất bản" },
                    { value: "draft", label: "Bản nháp" },
                    { value: "unpublished", label: "Chưa xuất bản" },
                  ]}
                />
              </label>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base">Sắp xếp theo: </span>
                <CustomSelect
                  value={sortField}
                  onChange={(v) => setSortField(v as SortField)}
                  options={[
                    { value: "priority", label: "Mức ưu tiên" },
                    { value: "createdAt", label: "Ngày tạo" },
                    { value: "name", label: "Tên" },
                    { value: "level", label: "Cấp độ" },
                  ]}
                />
              </label>

              <label className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-base">Thứ tự:</span>
                <CustomSelect
                  value={sortOrder}
                  onChange={(v) => setSortOrder(v as SortOrder)}
                  options={[
                    { value: "ASC", label: "Tăng dần" },
                    { value: "DESC", label: "Giảm dần" },
                  ]}
                />
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
                Đặt lại
              </Button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <p className="text-center text-gray-600">Đang tải...</p>
        ) : prunedTree.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center text-gray-600">
            Không có danh mục để hiển thị.
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
                          (Không có danh mục con)
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
