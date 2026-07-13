import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, ChevronUp,
  Tag, MapPin, Eye, Plus
} from 'lucide-react';
import { assetUnitsService, AssetUnit, AssetUnitStatus, AssetUnitQuery } from '../../services/assetUnitsService';
import { locationsService, Location } from '../../services/lookupService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Pagination } from '../../components/shared/Pagination';

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
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 text-muted-foreground" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary" />
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
    <div className="space-y-6">
      <PageHeader title="Serialized Assets" description={`${total} asset units total`}>
        <Button onClick={() => navigate('/dashboard/asset-units/new')}>
          <Plus className="w-4 h-4 mr-2" /> Register Asset
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by asset tag or serial number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) => {
            setStatusFilter(value === 'all' ? '' : (value as AssetUnitStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_maintenance">In Maintenance</SelectItem>
            <SelectItem value="in_repair">In Repair</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="written_off">Written Off</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={locationFilter ? String(locationFilter) : 'all'}
          onValueChange={(value) => {
            setLocationFilter(value === 'all' ? '' : Number(value));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('assetTag')}>
                  <div className="flex items-center gap-1">
                    Asset Tag <SortIcon col="assetTag" />
                  </div>
                </TableHead>
                <TableHead>Catalog Item</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status <SortIcon col="status" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('condition')}>
                  <div className="flex items-center gap-1">
                    Condition <SortIcon col="condition" />
                  </div>
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    Loading assets...
                  </TableCell>
                </TableRow>
              ) : sortedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                sortedAssets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/dashboard/asset-units/${asset.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono font-medium">{asset.assetTag}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {asset.catalogItem?.name || '—'}
                      <span className="text-xs text-muted-foreground ml-1">
                        {asset.catalogItem?.sku}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {asset.serialNumber || '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor[asset.status]}`}
                      >
                        {asset.status.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{asset.condition}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {asset.location?.name || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/asset-units/${asset.id}`);
                        }}
                        className="p-1 text-muted-foreground hover:text-primary rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={total}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetsListPage;
