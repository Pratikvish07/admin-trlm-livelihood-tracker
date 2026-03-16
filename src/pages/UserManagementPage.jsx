import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

const pageSizeOptions = [10, 25, 50, 100];

const sortOptions = [
  { label: 'Default', value: 'default' },
  { label: 'District', value: 'district' },
  { label: 'Village', value: 'village' },
  { label: 'Mobile Number', value: 'mobile' },
  { label: 'Lokos ID', value: 'lokosId' },
  { label: 'Member Name', value: 'memberName' },
];

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
  const [error, setError] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [lokosFilter, setLokosFilter] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showSort, setShowSort] = useState(true);

  const load = async (nextPage = pageNumber, nextSize = pageSize, options = {}) => {
    const { force = false } = options;
    const cacheKey = `${nextPage}-${nextSize}`;
    const cached = cacheRef.current.get(cacheKey);

    if (cached && !force) {
      setRows(cached.rows);
      setPageNumber(cached.pageNumber || nextPage);
      setPageSize(cached.pageSize || nextSize);
      setTotalPages(cached.totalPages || 1);
      setTotalCount(cached.totalCount || 0);
      return;
    }

    setLoading(rows.length === 0);
    setIsRefreshing(rows.length > 0);
    setError('');

    try {
      const result = await api.getShgMembers(nextPage, nextSize);
      cacheRef.current.set(cacheKey, result);
      setRows(Array.isArray(result.rows) ? result.rows : []);
      setPageNumber(result.pageNumber || nextPage);
      setPageSize(result.pageSize || nextSize);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount || 0);

      const nextCacheKey = `${nextPage + 1}-${nextSize}`;
      if ((result.totalPages || 1) > nextPage && !cacheRef.current.has(nextCacheKey)) {
        api
          .getShgMembers(nextPage + 1, nextSize)
          .then((prefetched) => {
            cacheRef.current.set(nextCacheKey, prefetched);
          })
          .catch(() => {});
      }
    } catch (err) {
      if (rows.length === 0) setRows([]);
      setError(err?.message || 'Unable to load SHG member list.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    load(pageNumber, pageSize);
  }, [pageNumber, pageSize]);

  const districtOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => readField(row, fieldAliases.district)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  const villageOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => readField(row, fieldAliases.village)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  const processedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      const memberName = readField(row, fieldAliases.memberName).toLowerCase();
      const lokosId = readField(row, fieldAliases.lokosId).toLowerCase();
      const district = readField(row, fieldAliases.district).toLowerCase();
      const village = readField(row, fieldAliases.village).toLowerCase();
      const mobile = readField(row, fieldAliases.mobile).toLowerCase();
      const shgName = readField(row, fieldAliases.shgName).toLowerCase();
      const query = search.trim().toLowerCase();

      if (query && !`${memberName} ${lokosId} ${district} ${village} ${mobile} ${shgName}`.includes(query)) {
        return false;
      }
      if (districtFilter && district !== districtFilter.toLowerCase()) return false;
      if (villageFilter && village !== villageFilter.toLowerCase()) return false;
      if (mobileFilter && !mobile.includes(mobileFilter.toLowerCase())) return false;
      if (lokosFilter && !lokosId.includes(lokosFilter.toLowerCase())) return false;
      return true;
    });

    if (sortBy === 'default') return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = readField(a, fieldAliases[sortBy] || [sortBy]).toLowerCase();
      const bValue = readField(b, fieldAliases[sortBy] || [sortBy]).toLowerCase();
      const compared = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'asc' ? compared : -compared;
    });
  }, [rows, search, districtFilter, villageFilter, mobileFilter, lokosFilter, sortBy, sortOrder]);

  const displayColumns = useMemo(() => {
    const baseColumns = [
      ['memberName', 'Member Name'],
      ['lokosId', 'Lokos ID'],
      ['mobile', 'Mobile Number'],
      ['district', 'District'],
      ['village', 'Village'],
      ['shgName', 'SHG Name'],
    ];

    if (processedRows.length === 0) return baseColumns;

    const extraKeys = Object.keys(processedRows[0]).filter((key) => !Object.values(fieldAliases).flat().includes(key));
    const extras = extraKeys.slice(0, 2).map((key) => [key, labelize(key)]);
    return [...baseColumns, ...extras];
  }, [processedRows]);

  const summaryCards = useMemo(() => {
    const uniqueDistricts = new Set(processedRows.map((row) => readField(row, fieldAliases.district)).filter(Boolean));
    const uniqueVillages = new Set(processedRows.map((row) => readField(row, fieldAliases.village)).filter(Boolean));
    const mobileCount = processedRows.filter((row) => readField(row, fieldAliases.mobile)).length;

    return [
      { label: 'Visible Members', value: processedRows.length, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
      { label: 'Districts On Page', value: uniqueDistricts.size, tone: 'text-cyan-700 bg-cyan-50 border-cyan-100' },
      { label: 'Villages On Page', value: uniqueVillages.size, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
      { label: 'Mobile Records', value: mobileCount, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
    ];
  }, [processedRows]);

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="portal-title">SHG Member List</h2>
            <p className="portal-subtitle mt-2 max-w-3xl">View uploaded SHG member data with filters, sorting, and pagination.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-2xl border p-4 shadow-sm ${card.tone}`}>
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-2 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="portal-card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Filters & Controls</h3>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                showFilters ? 'border-cyan-200 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600'
              }`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
              Filter
            </button>
            <button
              type="button"
              onClick={() => setShowSort((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                showSort ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'
              }`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path d="M8 7h10" />
                <path d="M8 12h7" />
                <path d="M8 17h4" />
                <path d="M5 6v12" />
              </svg>
              Sort
            </button>
            {isRefreshing ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Refreshing</span> : null}
            <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Total Records {totalCount}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <input className="rounded-2xl border border-slate-300 bg-white p-3" placeholder="Search member, SHG, village, mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white p-3"
              value={pageSize}
              onChange={(e) => {
                cacheRef.current.clear();
                setPageNumber(1);
                setPageSize(Number(e.target.value));
              }}>
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  Page Size: {size}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                cacheRef.current.delete(`${pageNumber}-${pageSize}`);
                load(pageNumber, pageSize, { force: true });
              }}
              disabled={loading}
              className="portal-btn-outline whitespace-nowrap rounded-2xl">
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {showFilters ? (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <select className="rounded-2xl border border-slate-300 bg-white p-3" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}>
                <option value="">All Districts</option>
                {districtOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select className="rounded-2xl border border-slate-300 bg-white p-3" value={villageFilter} onChange={(e) => setVillageFilter(e.target.value)}>
                <option value="">All Villages</option>
                {villageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input className="rounded-2xl border border-slate-300 bg-white p-3" placeholder="Filter by mobile number" value={mobileFilter} onChange={(e) => setMobileFilter(e.target.value)} />
              <input className="rounded-2xl border border-slate-300 bg-white p-3" placeholder="Filter by Lokos ID" value={lokosFilter} onChange={(e) => setLokosFilter(e.target.value)} />
            </div>
          ) : null}

          {showSort ? (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <select className="rounded-2xl border border-slate-300 bg-white p-3" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort By: {option.label}
                  </option>
                ))}
              </select>
              <select className="rounded-2xl border border-slate-300 bg-white p-3" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          ) : null}
        </div>
      </div>

      <div className="portal-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-800">SHG Tracking Records ({processedRows.length})</p>
            <p className="mt-1 text-sm text-slate-500">Page {pageNumber} of {Math.max(totalPages, 1)}</p>
          </div>
          <div className="flex gap-2">
            <button className="portal-btn-outline disabled:opacity-50" onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))} disabled={pageNumber <= 1 || loading}>
              Previous
            </button>
            <button className="portal-btn-outline disabled:opacity-50" onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))} disabled={pageNumber >= totalPages || loading}>
              Next
            </button>
          </div>
        </div>

        {error ? <p className="px-4 py-4 text-sm text-red-600">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                {displayColumns.map(([key, label]) => (
                  <th key={key} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-bold text-slate-700">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b border-slate-100">
                      {displayColumns.map(([key]) => (
                        <td key={key} className="px-4 py-3">
                          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : null}
              {processedRows.map((row, index) => (
                <tr key={row.id || row.memberId || row.MemberId || row.lokosId || index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                  {displayColumns.map(([key]) => (
                    <td key={key} className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {fieldAliases[key] ? readField(row, fieldAliases[key]) || 'NA' : row?.[key] ?? 'NA'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && processedRows.length === 0 ? <p className="px-4 py-4 text-slate-500">No SHG members found for the current filters.</p> : null}
      </div>
    </div>
  );
}
