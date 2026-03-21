import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

const pageSizeOptions = [10, 25, 50, 100];

const fieldAliases = {
  memberName: ['memberName', 'name', 'MemberName', 'beneficiaryName'],
  lokosId: ['lokosId', 'LokosId', 'lokosID', 'memberCode', 'MemberCode', 'memberId', 'MemberId'],
  district: ['district', 'District', 'districtName', 'DistrictName'],
  village: ['village', 'Village', 'villageName', 'VillageName'],
  mobile: ['mobile', 'Mobile', 'mobileNumber', 'MobileNumber', 'contactNumber', 'ContactNumber'],
  shgName: ['shgName', 'SHGName', 'groupName', 'GroupName'],
};

const readField = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && value !== '') return String(value);
  }
  return '';
};

const labelize = (value) =>
  String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function UserManagementPage() {
  const cacheRef = useRef(new Map());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = async (nextPage = pageNumber, nextSize = pageSize, options = {}) => {
    const { force = false } = options;
    const cacheKey = `${nextPage}-${nextSize}`;
    const cached = cacheRef.current.get(cacheKey);

    console.log('🔄 SHG load attempt:', { nextPage, nextSize, hasCache: !!cached, force });

    if (cached && !force) {
      console.log('📦 Using cached SHG data:', cached);
      setRows(cached.rows || []);
      setPageNumber(cached.pageNumber || nextPage);
      setPageSize(cached.pageSize || nextSize);
      setTotalPages(cached.totalPages || 1);
      setTotalCount(cached.totalCount || 0);
      return;
    }

    console.log('🔍 Loading SHG members:', { nextPage, nextSize });
    setLoading(rows.length === 0);
    setIsRefreshing(rows.length > 0);

    try {
      const result = await api.getShgMembers(nextPage, nextSize);
      console.log('✅ SHG API Response page', nextPage, ':', { totalCount: result.totalCount, rowsCount: result.rows?.length, totalPages: result.totalPages });
      cacheRef.current.set(cacheKey, result);
      const memberRows = Array.isArray(result.rows) ? result.rows : result.items || result.data || result || [];
      console.log('📊 Parsed SHG rows page', nextPage, ':', memberRows.length, 'rows');
      setRows(memberRows);
      setPageNumber(result.pageNumber || nextPage);
      setPageSize(result.pageSize || nextSize);
      const computedPages = result.totalPages || Math.ceil((result.totalCount || memberRows.length || 0) / nextSize) || 1;
      setTotalPages(computedPages);
      setTotalCount(result.totalCount || result.count || memberRows.length || 0);
      console.log('📈 SHG pagination updated:', { pageNumber: result.pageNumber || nextPage, totalPages: computedPages, totalCount: result.totalCount || memberRows.length });

      const nextCacheKey = `${nextPage + 1}-${nextSize}`;
      if ((result.totalPages || 1) > nextPage && !cacheRef.current.has(nextCacheKey)) {
        api
          .getShgMembers(nextPage + 1, nextSize)
          .then((prefetched) => {
            cacheRef.current.set(nextCacheKey, prefetched);
          })
          .catch(() => {});
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load(pageNumber, pageSize);
  }, [pageNumber, pageSize]);

  const displayColumns = useMemo(() => {
    const baseColumns = [
      ['memberName', 'Member Name'],
      ['lokosId', 'Lokos ID'],
      ['mobile', 'Mobile Number'],
      ['district', 'District'],
      ['village', 'Village'],
      ['shgName', 'SHG Name'],
    ];

    if (rows.length === 0) return baseColumns;

    const extraKeys = Object.keys(rows[0]).filter((key) => !Object.values(fieldAliases).flat().includes(key));
    const extras = extraKeys.slice(0, 2).map((key) => [key, labelize(key)]);
    return [...baseColumns, ...extras];
  }, [rows]);

  const summaryCards = useMemo(() => {
    const uniqueShgs = new Set(
      rows
        .map((row) => readField(row, fieldAliases.shgName))
        .filter(Boolean)
    );
    const uniqueDistricts = new Set(rows.map((row) => readField(row, fieldAliases.district)).filter(Boolean));
    const uniqueVillages = new Set(rows.map((row) => readField(row, fieldAliases.village)).filter(Boolean));
    const mobileCount = rows.filter((row) => readField(row, fieldAliases.mobile)).length;

    return [
      { label: 'Total SHGs', value: uniqueShgs.size, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
      { label: 'Districts on Page', value: uniqueDistricts.size, tone: 'text-cyan-700 bg-cyan-50 border-cyan-100' },
      { label: 'Villages on Page', value: uniqueVillages.size, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
      { label: 'Mobile Records', value: mobileCount, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
    ];
  }, [rows]);

  const refreshData = () => {
    console.log('🔄 Force refresh SHG data');
    cacheRef.current.clear();
    load(1, pageSize, { force: true });
  };

  const clearCacheAndReload = () => {
    console.log('🗑️ Clearing ALL SHG cache');
    cacheRef.current.clear();
    load(pageNumber, pageSize, { force: true });
  };

  const goToPage = (targetPage) => {
    if (targetPage >= 1 && targetPage <= totalPages && targetPage !== pageNumber) {
      setPageNumber(targetPage);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const range = [];

    for (let i = Math.max(2, pageNumber - delta); i <= Math.min(totalPages - 1, pageNumber + delta); i += 1) {
      range.push(i);
    }

    if (pageNumber - delta > 2) {
      pages.push(1, '...');
    } else {
      pages.push(1);
    }

    pages.push(...range);

    if (pageNumber + delta < totalPages - 1) {
      pages.push('...', totalPages);
    } else if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages.map((page, index) => (
      <button
        key={`${page}-${index}`}
        onClick={() => typeof page === 'number' && goToPage(page)}
        disabled={page === '...' || loading}
        className={`mx-0.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          page === pageNumber
            ? 'scale-105 bg-blue-600 text-white shadow-md'
            : page === '...'
              ? 'cursor-default px-1 text-slate-400'
              : 'border border-slate-300 bg-white text-slate-700 hover:scale-[1.02] hover:bg-slate-50 hover:shadow-sm active:scale-100'
        }`}>
        {page}
      </button>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="portal-title">SHG Member List</h2>
            <p className="portal-subtitle mt-2 max-w-2xl">Paginated view of uploaded SHG member data from server.</p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="portal-btn-outline whitespace-nowrap rounded-2xl px-4 py-2.5">
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${card.tone}`}>
            <p className="text-sm font-medium text-slate-600">{card.label}</p>
            <p className="mt-1 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="portal-card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <p className="text-lg font-semibold text-slate-800">SHG Members ({totalCount} total)</p>
          <p className="mt-1 text-sm text-slate-500">
            Page {pageNumber} of {totalPages} | Size: {pageSize} | Records: {rows.length}
          </p>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/30 px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <select
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium"
              value={pageSize}
              onChange={(e) => {
                cacheRef.current.clear();
                setPageNumber(1);
                setPageSize(Number(e.target.value));
              }}>
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            {totalPages > 1 ? (
              <>
                <button
                  className="portal-btn-outline min-w-[80px] whitespace-nowrap px-4 py-2 text-sm"
                  onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                  disabled={pageNumber <= 1 || loading}>
                  Previous
                </button>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {renderPageNumbers()}
                </div>
                <button
                  className="portal-btn-primary min-w-[64px] whitespace-nowrap px-4 py-2 text-sm"
                  onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                  disabled={pageNumber >= totalPages || loading}>
                  Next
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                {displayColumns.map(([key, label]) => (
                  <th key={key} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && rows.length === 0
                ? Array.from({ length: Math.min(10, pageSize) }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      {displayColumns.map(([key]) => (
                        <td key={key} className="px-6 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row, index) => (
                    <tr key={row.id || row.memberId || row.lokosId || index} className="transition-colors hover:bg-slate-50">
                      {displayColumns.map(([key]) => (
                        <td key={key} className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                          {fieldAliases[key] ? readField(row, fieldAliases[key]) || 'NA' : row?.[key] ?? 'NA'}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 ? (
          <div className="border-t border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-slate-100 p-4 flex items-center justify-center text-2xl">
              👥
            </div>
            <p className="text-lg font-medium text-slate-700 mb-2">No SHG members found</p>
            <p>Try adjusting page size or check if data is uploaded to server.</p>
            <button onClick={() => load(1, pageSize, {force: true})} className="mt-4 portal-btn-primary px-6 py-2 rounded-xl">
              Reload Data
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
