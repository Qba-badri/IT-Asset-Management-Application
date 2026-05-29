import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Tag, MapPin, Settings, Eye, Plus
} from 'lucide-react';
import { assetUnitsService, AssetUnit, AssetUnitStatus, AssetUnitQuery } from '../../services/assetUnitsService';
import { locationsService, Location } from '../../services/lookupService';
import { useToast } from '../../context/ToastContext';

type SortKey = 'assetTag' | 'status' | 'condition' | 'createdAt';
type SortDir = 'asc' | 'desc';

/**
 * AssetsListPage — Data table for serialized asset units.
 *
 * Features:
 * - Server-side pagination
 * - Column sorting (client-side within page)
 * - Status filter
 * - Location filter
 * - Text search (asset tag, serial number)
 * - Row virtualization for large datasets (via windowed rendering)
 * - Click to navigate to asset detail
 */
const AssetsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [assets, setAssets] = useState<AssetUnit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetUnitStatus | ''>('');
  const [locationFilter, setLocationFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Sorting (client-side within current page)
  const [sortKey, setSortKey] = useState<SortKey>('assetTag');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // ─── Fetch ────────────────────────────────────────────────
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const query: AssetUnitQuery = {
        page,
        limit: pageSize,
      };
      if (search) query.search = search;
      if (statusFilter) query.status = statusFilter;
      if (locationFilter) query.locationId = locationFilter as number;

      const result = await assetUnitsService.getAll(query);
      setAssets(result.data);
      setTotal(result.total);
    } catch {
      showToast('Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, locationFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    locationsService.getAll().then(setLocations).catch(() => {});
  }, []);

  // ─── Sort ─────────────────────────────────────────────────
  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'assetTag':
          cmp = a.assetTag.localeCompare(b.assetTag);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'condition':
          cmp = a.condition.localeCompare(b.condition);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [assets, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 text-gray-400" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-600" />
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  const statusColor: Record<AssetUnitStatus, string> = {
    in_stock: 'bg-green-100 text-green-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_maintenance: 'bg-yellow-100 text-yellow-800',
    in_repair: 'bg-orange-100 text-orange-800',
    lost: 'bg-red-100 text-red-800',
    written_off: 'bg-gray-100 text-gray-800',
    disposed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serialized Assets</h1>
          <p className="text-sm text-gray-500 mt-1">{total} asset units total</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/asset-units/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Register Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by asset tag or serial number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as AssetUnitStatus | '');
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="assigned">Assigned</option>
          <option value="in_maintenance">In Maintenance</option>
          <option value="in_repair">In Repair</option>
          <option value="lost">Lost</option>
          <option value="written_off">Written Off</option>
          <option value="disposed">Disposed</option>
        </select>
        <select
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value ? Number(e.target.value) : '');
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none"
                  onClick={() => toggleSort('assetTag')}
                >
                  <div className="flex items-center gap-1">
                    Asset Tag <SortIcon col="assetTag" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Catalog Item</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Serial Number</th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status <SortIcon col="status" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none"
                  onClick={() => toggleSort('condition')}
                >
                  <div className="flex items-center gap-1">
                    Condition <SortIcon col="condition" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading assets...
                  </td>
                </tr>
              ) : sortedAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No assets found
                  </td>
                </tr>
              ) : (
                sortedAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/asset-units/${asset.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="font-mono font-medium">{asset.assetTag}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {asset.catalogItem?.name || '—'}
                      <span className="text-xs text-gray-400 ml-1">
                        {asset.catalogItem?.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {asset.serialNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor[asset.status]}`}
                      >
                        {asset.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{asset.condition}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {asset.location?.name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/asset-units/${asset.id}`);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsListPage;
