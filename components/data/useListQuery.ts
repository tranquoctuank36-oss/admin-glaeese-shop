"use client";

import { useEffect, useMemo, useState } from "react";

export type ListQueryState = {
  search: string;
  page: number;
  limit: number;
  sortField: string | undefined;
  sortOrder: "ASC" | "DESC" | undefined;
  isActive: "all" | "true" | "false";
  isDeleted: "all" | "true" | "false";
  depth?: number | undefined;
  brandStatus: "all" | string;
  categoryStatus: "all" | string;
  productStatus?: "all" | string;
  imageStatus?: "all" | "draft" | "used";
  ownerType?: "all" | "product_variant" | "brand" | "discount";
  roles?: string[];
  statuses?: string[];
};

const DEFAULT_ALLOWED_SORT_BY = ["name", "createdAt"] as const;

function isValidsortField(v: unknown, allowed: readonly string[]): v is string {
  return allowed.includes(v as any);
}

export function useDebounce<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type TupleToUnion<T extends readonly unknown[]> = T[number];
export type ListApiParams<S extends readonly string[]> = {} & {
  page: number;
  limit: number;
  sortField?: TupleToUnion<S>;
  sortOrder?: "ASC" | "DESC";
  isActive?: boolean;
  isDeleted?: boolean;
  brandStatus?: string;
  categoryStatus?: string;
  productStatus?: string;
} & Record<string, any>;

export type ListQueryOptions<S extends readonly string[]> = {
  allowedsortField?: S;
  mapSearchToParam?: string;
  extraFilters?: Record<string, any>;
};

function shallowEqual(a: any, b: any) {
  if (a === b) return true;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
} 

export function useListQuery<
  S extends readonly string[] = typeof DEFAULT_ALLOWED_SORT_BY
>(initial?: Partial<ListQueryState>, options?: ListQueryOptions<S>) {
  const {
    allowedsortField = DEFAULT_ALLOWED_SORT_BY as unknown as S,
    mapSearchToParam = "search",
    extraFilters = {},
  } = options ?? {};

  const [q, setQ] = useState<ListQueryState>({
    search: "",
    page: 1,
    limit: 10,
    sortField: undefined,
    sortOrder: undefined,
    isActive: "all",
    isDeleted: "all",
    brandStatus: "all",
    categoryStatus: "all",
    productStatus: "all",
    imageStatus: "all",
    ownerType: "all",
    depth: undefined,
    roles: undefined,
    statuses: undefined,
    ...initial,
  });


  const setAndResetPage = (patch: Partial<ListQueryState>) =>
    setQ((prev) => {
      const next = { ...prev, page: 1, ...patch };
      return shallowEqual(prev, next) ? prev : next;
    });

  const debouncedSearch = useDebounce(q.search, 400);

  const apiParams = useMemo(() => {
    const searchBlock =
      debouncedSearch && debouncedSearch.trim()
        ? { [mapSearchToParam]: debouncedSearch.trim() }
        : {};

    const sortFieldOut = isValidsortField(
      q.sortField,
      allowedsortField as readonly string[]
    )
      ? (q.sortField as TupleToUnion<S>)
      : undefined;

    const params: ListApiParams<S> = {
      ...searchBlock,
      page: q.page,
      limit: q.limit,
      sortField: sortFieldOut,
      sortOrder: q.sortOrder as "ASC" | "DESC" | undefined,
      isActive: q.isActive === "all" ? undefined : q.isActive === "true",
      isDeleted: q.isDeleted === "all" ? undefined : q.isDeleted === "true",
      brandStatus: q.brandStatus === "all" ? undefined : q.brandStatus,
      status:
      q.categoryStatus && q.categoryStatus !== "all"
        ? q.categoryStatus
        : q.productStatus && q.productStatus !== "all"
        ? q.productStatus
        : q.imageStatus && q.imageStatus !== "all"
        ? q.imageStatus
        : undefined,
      ownerType: q.ownerType && q.ownerType !== "all" ? q.ownerType : undefined,
      ...(typeof (q as any).depth !== "undefined" ? { depth: (q as any).depth } : {}),
      ...(q.roles && q.roles.length > 0 ? { roles: q.roles } : {}),
      ...(q.statuses && q.statuses.length > 0 ? { statuses: q.statuses } : {}),
      ...extraFilters,
    };

    return params;
  }, [
    debouncedSearch,
    q.page,
    q.limit,
    q.sortField,
    q.sortOrder,
    q.isActive,
    q.isDeleted,
    q.brandStatus,
    q.categoryStatus,
    q.productStatus,
    q.imageStatus,
    q.ownerType,
    q.depth,
    q.roles,
    q.statuses,
    allowedsortField,
    mapSearchToParam,
    extraFilters,
  ]);

  const apiKey = useMemo(() => JSON.stringify(apiParams), [apiParams]);

  return {
    q,
    setQ,
    setAndResetPage,
    apiParams,
    apiKey,
  };
}
  