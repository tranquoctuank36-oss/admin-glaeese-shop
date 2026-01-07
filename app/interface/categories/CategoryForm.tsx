"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader } from "lucide-react";
import FloatingInput from "@/components/FloatingInput";
import { Button } from "@/components/ui/button";
import { CategoryTree, getCategoriesTree } from "@/services/categoryService";
import toast from "react-hot-toast";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CategoryFormValues = {
  name: string;
  slug: string;
  status: "draft" | "published" | "unpublished";
  description?: string;
  priority: number; // 0..100
  parentId?: string | null;
  relativeUrl: string | null;
};

const NO_PARENT = "__NONE__" as const;

type Id = string;
type NodeMap = Record<string, CategoryTree>;
type ParentMap = Record<string, string | null>;

export default function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initial.slug);
  const [slug, setSlug] = useState(initial.slug ?? "");

  const [categoryStatus, setCategoryStatus] = useState<
    "draft" | "published" | "unpublished"
  >(initial.status ?? "published");

  const [description, setDescription] = useState(initial.description ?? "");
  const [priority, setPriority] = useState<number>(
    Number.isFinite(initial.priority) ? initial.priority : 100
  );

  const [parentId, setParentId] = useState<string>(
    initial.parentId ? String(initial.parentId) : NO_PARENT
  );

  const [relativeUrl, setRelativeUrl] = useState<string>(
    (initial.relativeUrl as any) ?? ""
  );

  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [idMap, setIdMap] = useState<NodeMap>({});
  const [path, setPath] = useState<Id[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const autoSlug = useMemo(() => slugify(name), [name]);
  const displaySlug = (slugEdited ? slug : autoSlug).trim();

  const childrenOf = (pid: string | null): CategoryTree[] => {
    if (pid === null) return tree.filter((n) => (n.level ?? 0) === 0);
    if (pid === NO_PARENT) return [];
    const node = idMap[pid];
    return node?.children ?? [];
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTree(true);
        const res = await getCategoriesTree({
          depth: "5",
          sortField: "priority",
          sortOrder: "ASC",
        });
        if (!alive) return;

        const rows: CategoryTree[] = res?.data ?? [];
        setTree(rows);

        // ---- build maps (cục bộ) và set state
        const _id: NodeMap = {};
        const _p: ParentMap = {};
        const dfs = (n: CategoryTree, p: string | null) => {
          _id[n.id] = n;
          _p[n.id] = p;
          (n.children ?? []).forEach((c) => dfs(c, n.id));
        };
        rows.forEach((r) => dfs(r, null));

        setIdMap(_id);

        // ---- dùng map cục bộ để dựng path ngay (không đợi state)
        const pathToRootWith = (leafId: string, pm: ParentMap): string[] => {
          const arr: string[] = [];
          let cur: string | null = leafId;
          while (cur) {
            arr.push(cur);
            cur = pm[cur] ?? null;
          }
          return arr.reverse();
        };

        if (initial.parentId) {
          const pth = pathToRootWith(String(initial.parentId), _p);
          // nếu muốn mở sẵn cấp tiếp theo với "No parent":
          // nếu pth.length >= 1 => append "" để hiện Level kế tiếp với No parent
          setPath(pth);
          setParentId(String(initial.parentId));
        } else {
          setPath([]);
          setParentId(NO_PARENT);
        }
      } finally {
        if (alive) setLoadingTree(false);
      }
    })();
    return () => {
      alive = false;
    };
    // thêm initial.parentId vào deps để khi đổi item cũng khởi tạo đúng
  }, [initial.parentId]);

  const normalizeRelative = (v: string) => {
    const raw = (v || "").trim();
    if (!raw) return "";
    try {
      if (/^https?:\/\//i.test(raw)) {
        const u = new URL(raw);
        return `${u.pathname}${u.search}${u.hash}` || "";
      }
    } catch {
      /* ignore */
    }
    return raw;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");


    try {
      const cleanedRelative = normalizeRelative(relativeUrl);

      await onSubmit({
        name: name.trim(),
        slug: displaySlug,
        status: categoryStatus,
        description: description.trim(),
        priority: Math.max(0, Math.min(100, Math.trunc(priority || 0))),
        parentId: parentId === NO_PARENT ? undefined : parentId,
        relativeUrl: cleanedRelative ? cleanedRelative : null,
      });
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.detail;
      toast.error(detail);
      // const parentLabel =
      //   parentId !== NO_PARENT && idMap[parentId]
      //     ? idMap[parentId].name
      //     : "selected parent category";
      // if (
      //   /vòng\s*lặp/i.test(detail) ||
      //   (/parent/i.test(detail) && /loop|cycle/i.test(detail))
      // ) {
      //   setErr(
      //     `Cannot move this category into the parent category “${parentLabel}” because it would create a loop.`
      //   );
      //   setPath(prevPath);
      //   setParentId(prevParentId);
      // } else if (
      //   typeof detail === "string" &&
      //   (detail.includes("độ sâu tối đa") ||
      //     /maximum depth/i.test(detail) ||
      //     /max depth/i.test(detail) ||
      //     /reached depth/i.test(detail))
      // ) {
      //   const parentName =
      //     parentId !== NO_PARENT && idMap[parentId]
      //       ? idMap[parentId].name
      //       : "selected parent category";
      //   setErr(
      //     `Selected parent category "${parentName}" has reached maximum depth`
      //   );
      // } else {
      //   toast.error(detail);
      // }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      {/* Name */}
      <FloatingInput
        id="name"
        label="Tên"
        required
        value={name}
        disabled={loading}
        onChange={(v) => {
          setName(v);
          if (!slugEdited) setSlug(slugify(v));
        }}
      />

      {/* Slug */}
      <FloatingInput
        id="slug"
        label="Slug"
        required
        value={displaySlug}
        disabled={loading}
        onChange={(v) => {
          setSlug(v);
          setSlugEdited(true);
        }}
      />
      {name && (
        <p className="-mt-2 text-xs text-gray-500">
          Gợi ý: <span className="font-medium">{autoSlug}</span>
        </p>
      )}

      {/* Parent (cascader) dùng FloatingInput */}
      <div className="space-y-4">
        <FloatingInput
          id="parent-lv0"
          label="Danh mục cha (Cấp 0)"
          as="select"
          disabled={loading || loadingTree}
          value={path[0] ?? (parentId === NO_PARENT ? NO_PARENT : "")}
          onChange={(v) => {
            if (v === NO_PARENT) {
              setPath([]);
              setParentId(NO_PARENT);
              return;
            }
            setPath([v, ""]);
            setParentId(v);
          }}
          options={[
            { value: NO_PARENT as any, label: "Không có cha" },
            ...childrenOf(null).map((r) => ({ value: r.id, label: r.name })),
          ]}
        />

        {/* Level 1 (chỉ hiển thị khi đã chọn lv0) */}
        {path[0] && (
          <FloatingInput
            id="parent-lv1"
            label="Danh mục cha (Cấp 1)"
            as="select"
            disabled={loading || loadingTree}
            value={
              !path[1] && parentId === path[0]
                ? (NO_PARENT as any)
                : path[1] ?? ""
            }
            onChange={(v) => {
              if (v === NO_PARENT) {
                setPath([path[0]!]);
                setParentId(path[0]!);
                return;
              }
              if (!v) {
                setPath([path[0]!]);
                setParentId(path[0]!);
              } else {
                setPath([path[0]!, v]);
                setParentId(v);
              }
            }}
            options={[
              { value: NO_PARENT as any, label: "Không có cha" },
              ...childrenOf(path[0]!).map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
          />
        )}

        {/* Level ≥ 2 – render động theo path */}
        {path.map((pid, idx) => {
          if (idx < 1) return null; // lv1 đã render ở trên
          const nextLevel = idx + 1;
          const kids = childrenOf(pid);
          if (!kids.length) return null;

          const selectValue =
            !path[nextLevel] && parentId === path[idx]
              ? (NO_PARENT as any)
              : path[nextLevel] ?? "";

          return (
            <FloatingInput
              key={`parent-lv${nextLevel}`}
              id={`parent-lv${nextLevel}`}
              label={`Danh mục cha (Cấp ${nextLevel})`}
              as="select"
              disabled={loading || loadingTree}
              value={selectValue}
              onChange={(v) => {
                if (v === NO_PARENT) {
                  const newPath = path.slice(0, nextLevel);
                  setPath(newPath);
                  setParentId(path[idx]);
                  return;
                }
                if (!v) {
                  const newPath = path.slice(0, nextLevel);
                  setPath(newPath);
                  setParentId(newPath[newPath.length - 1] ?? NO_PARENT);
                } else {
                  const newPath = [...path.slice(0, nextLevel), v];
                  setPath(newPath);
                  setParentId(v);
                }
              }}
              options={[
                { value: NO_PARENT as any, label: "Không có cha" },
                ...kids.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          );
        })}
      </div>

      {/* Relative URL */}
      <FloatingInput
        id="relativeUrl"
        label="URL tương đối (ví dụ: products?productType=frame&gender=Male)"
        required
        value={relativeUrl}
        onChange={(v) => setRelativeUrl(v)}
        disabled={loading}
      />

      {/* Description */}
      <FloatingInput
        id="description"
        label="Mô tả"
        as="textarea"
        rows={4}
        value={description}
        onChange={setDescription}
        disabled={loading}
      />

      {/* Priority 0..100 */}
      <div className="w-full">
        <label htmlFor="priority" className="block text-sm text-gray-600 mb-1">
          Mức ưu tiên (0–100)
        </label>
        <input
          id="priority"
          type="number"
          min={0}
          max={100}
          step={1}
          value={Number.isFinite(priority) ? priority : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            setPriority(Math.max(0, Math.min(100, Math.trunc(n))));
          }}
          disabled={loading}
          className="w-full h-12 px-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:border-2 focus:border-blue-400 outline-none transition"
        />
      </div>

      {/* Status */}
      <FloatingInput
        id="categoryStatus"
        label="Trạng thái"
        as="select"
        disabled={loading}
        value={categoryStatus}
        onChange={(v) =>
          setCategoryStatus(
            (["draft", "published", "unpublished"].includes(v)
              ? v
              : "published") as any
          )
        }
        options={[
          { value: "draft", label: "Bản nháp" },
          { value: "published", label: "Đã xuất bản" },
          { value: "unpublished", label: "Chưa xuất bản" },
        ]}
      />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          className="h-10 bg-gray-500 hover:bg-gray-700 text-white"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : submitLabel}
        </Button>
      </div>

      {err && <p className="text-red-500 text-center">{err}</p>}
    </form>
  );
}
