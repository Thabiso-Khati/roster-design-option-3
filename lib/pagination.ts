/**
 * lib/pagination.ts
 * ─────────────────
 * Pure helpers for offset pagination used by all list API routes.
 *
 * Centralising the maths here means:
 *   - One place to test the edge cases
 *   - Route handlers stay tidy (one import, no repeated parseInt guards)
 *   - Consistent behaviour across all endpoints
 */

export interface PaginationParams {
  page:    number;   // 0-based current page
  limit:   number;   // items per page (already clamped)
  from:    number;   // Supabase .range() start (inclusive)
  to:      number;   // Supabase .range() end   (inclusive)
}

/**
 * Parse + clamp pagination query params from a URLSearchParams object.
 *
 * @param searchParams  URLSearchParams from req.nextUrl
 * @param defaultLimit  Sensible default for this resource (e.g. 20)
 * @param maxLimit      Hard cap (e.g. 100)
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit: number,
  maxLimit:     number,
): PaginationParams {
  const page  = Math.max(0, parseInt(searchParams.get("page")  ?? "0",               10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get("limit") ?? String(defaultLimit), 10)));
  const from  = page * limit;
  const to    = from + limit - 1;
  return { page, limit, from, to };
}

/**
 * Build the pagination envelope to include in every list response.
 *
 * @param data      The slice returned by Supabase (may be shorter than limit on last page)
 * @param count     Total row count from { count: "exact" }
 * @param params    Result of parsePagination()
 */
export function paginationEnvelope(
  data:   unknown[],
  count:  number | null,
  params: PaginationParams,
): { total: number; page: number; limit: number; hasMore: boolean } {
  const total = count ?? 0;
  return {
    total,
    page:    params.page,
    limit:   params.limit,
    hasMore: params.from + data.length < total,
  };
}
