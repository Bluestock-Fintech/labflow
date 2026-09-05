import { useMemo, useState } from 'react';

export function usePagination(items, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  function changePageSize(size) {
    setPageSize(size);
    setPage(1);
  }

  return {
    page: safePage,
    pageSize,
    total: items.length,
    paged,
    setPage,
    setPageSize: changePageSize,
  };
}
