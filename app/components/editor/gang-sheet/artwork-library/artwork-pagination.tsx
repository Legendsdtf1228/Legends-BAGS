export function ArtworkPagination({
  page,
  pageCount,
  start,
  end,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  start: number;
  end: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="lgs-artlib-page">
      <span>
        {start}–{end} of {total}
      </span>
      <span>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          Prev
        </button>{" "}
        <button type="button" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
          Next
        </button>
      </span>
    </div>
  );
}
