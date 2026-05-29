import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Package, MapPin, TrendingUp, TrendingDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { stockService, StockByLocation, StockLedgerEntry, StockQuery, LedgerQuery } from '../../services/stockService';
import { locationsService, Location } from '../../services/lookupService';
import { useToast } from '../../context/ToastContext';

type Tab = 'levels' | 'ledger';

const StockPage: React.FC = () => {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('levels');

  // Stock Levels
  const [stocks, setStocks] = useState<StockByLocation[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockSearch, setStockSearch] = useState('');
  const [stockPage, setStockPage] = useState(1);

  // Ledger
  const [ledger, setLedger] = useState<StockLedgerEntry[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationFilter, setLocationFilter] = useState<number | ''>('');

  useEffect(() => { locationsService.getAll().then(setLocations).catch(() => { }); }, []);

  const fetchStocks = useCallback(async () => {
    try {
      const query: StockQuery = { page: stockPage, limit: 25 };
      if (stockSearch) query.search = stockSearch;
      if (locationFilter) query.locationId = locationFilter as number;
      const result = await stockService.getAll(query);
      setStocks(result.data);
      setStockTotal(result.total);
    } catch { showToast('Failed to load stock levels', 'error'); }
  }, [stockPage, stockSearch, locationFilter]);

  const fetchLedger = useCallback(async () => {
    try {
      const query: LedgerQuery = { page: ledgerPage, limit: 50 };
      if (locationFilter) query.locationId = locationFilter as number;
      const result = await stockService.getLedger(query);
      setLedger(result.data);
      setLedgerTotal(result.total);
    } catch { showToast('Failed to load ledger', 'error'); }
  }, [ledgerPage, locationFilter]);

  useEffect(() => { if (tab === 'levels') fetchStocks(); }, [fetchStocks, tab]);
  useEffect(() => { if (tab === 'ledger') fetchLedger(); }, [fetchLedger, tab]);

  const stockPages = Math.ceil(stockTotal / 25);
  const ledgerPages = Math.ceil(ledgerTotal / 50);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Stock Management</h1>

      {/* Tabs */}
      <div className="border-b mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-8">
          <button
            onClick={() => setTab('levels')}
            className={`flex items-center gap-2 px-0 pb-3 text-sm font-medium transition-all relative ${tab === 'levels' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Package className="w-4 h-4" />
            <span>Stock Levels</span>
            {tab === 'levels' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />}
          </button>
          <button
            onClick={() => setTab('ledger')}
            className={`flex items-center gap-2 px-0 pb-3 text-sm font-medium transition-all relative ${tab === 'ledger' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Stock Ledger</span>
            {tab === 'ledger' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {tab === 'levels' && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search items..." value={stockSearch}
              onChange={(e) => { setStockSearch(e.target.value); setStockPage(1); }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
          </div>
        )}
        <select value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value ? Number(e.target.value) : ''); setStockPage(1); setLedgerPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Locations</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Stock Levels Table */}
      {tab === 'levels' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Quantity</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Reorder Point</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stocks.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No stock records</td></tr>
              ) : stocks.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.catalogItem?.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{s.catalogItem?.sku}</td>
                  <td className="px-4 py-3"><MapPin className="w-3 h-3 inline mr-1 text-gray-400" />{s.location?.name || '—'}</td>
                  <td className={`px-4 py-3 text-right font-bold ${s.quantity <= (s.catalogItem?.reorderPoint || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                    {s.quantity}
                    {s.quantity <= (s.catalogItem?.reorderPoint || 0) && (
                      <span className="ml-1 text-xs text-red-500">LOW</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.catalogItem?.reorderPoint || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stockPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-600">Page {stockPage} of {stockPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setStockPage((p) => Math.max(1, p - 1))} disabled={stockPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setStockPage((p) => Math.min(stockPages, p + 1))} disabled={stockPage === stockPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ledger Table */}
      {tab === 'ledger' && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Item</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Change</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Balance</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ledger.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No ledger entries</td></tr>
              ) : ledger.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{entry.catalogItem?.name}</td>
                  <td className="px-4 py-3">{entry.location?.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100">
                      {entry.reason.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${entry.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.quantityChange > 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                    {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{entry.runningBalance}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.createdBy?.firstName} {entry.createdBy?.lastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledgerPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-sm text-gray-600">Page {ledgerPage} of {ledgerPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setLedgerPage((p) => Math.max(1, p - 1))} disabled={ledgerPage === 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setLedgerPage((p) => Math.min(ledgerPages, p + 1))} disabled={ledgerPage === ledgerPages} className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockPage;
