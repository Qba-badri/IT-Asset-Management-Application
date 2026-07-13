import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Package, MapPin, TrendingUp, TrendingDown, Sliders, Loader2
} from 'lucide-react';
import { stockService, StockByLocation, StockLedgerEntry, StockQuery, LedgerQuery } from '../../services/stockService';
import { locationsService, Location } from '../../services/lookupService';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Pagination } from '../../components/shared/Pagination';

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

  // Adjust Stock modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<StockByLocation | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

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

  const openAdjustModal = (stock: StockByLocation) => {
    setAdjustTarget(stock);
    setAdjustQuantity(stock.quantity);
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleAdjust = async () => {
    if (!adjustTarget) return;
    if (!adjustQuantity || adjustQuantity <= 0) {
      showToast('Quantity must be greater than zero', 'error');
      return;
    }
    if (!adjustNotes.trim()) {
      showToast('Please provide a reason for this adjustment', 'error');
      return;
    }
    try {
      setAdjusting(true);
      await stockService.adjust({
        catalogItemId: adjustTarget.catalogItemId,
        locationId: adjustTarget.locationId,
        newQuantity: adjustQuantity,
        notes: adjustNotes,
      });
      showToast('Stock adjusted successfully', 'success');
      setShowAdjustModal(false);
      fetchStocks();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to adjust stock';
      showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Management" />

      {/* Tabs */}
      <div className="border-b overflow-x-auto no-scrollbar">
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
      <div className="flex flex-wrap items-center gap-3">
        {tab === 'levels' && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="text" placeholder="Search items..." value={stockSearch}
              onChange={(e) => { setStockSearch(e.target.value); setStockPage(1); }}
              className="pl-10" />
          </div>
        )}
        <Select
          value={locationFilter ? String(locationFilter) : 'all'}
          onValueChange={(value) => { setLocationFilter(value === 'all' ? '' : Number(value)); setStockPage(1); setLedgerPage(1); }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stock Levels Table */}
      {tab === 'levels' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No stock records</TableCell></TableRow>
                ) : stocks.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.catalogItem?.name || '—'}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{s.catalogItem?.sku}</TableCell>
                    <TableCell><MapPin className="w-3 h-3 inline mr-1 text-muted-foreground" />{s.location?.name || '—'}</TableCell>
                    <TableCell className={`text-right font-bold ${s.quantity <= (s.catalogItem?.reorderPoint || 0) ? 'text-red-600' : 'text-foreground'}`}>
                      {s.quantity}
                      {s.quantity <= (s.catalogItem?.reorderPoint || 0) && (
                        <span className="ml-1 text-xs text-red-500">LOW</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{s.catalogItem?.reorderPoint || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => openAdjustModal(s)} title="Adjust Stock">
                        <Sliders className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              currentPage={stockPage}
              totalPages={stockPages}
              onPageChange={setStockPage}
              totalItems={stockTotal}
              pageSize={25}
            />
          </CardContent>
        </Card>
      )}

      {/* Ledger Table */}
      {tab === 'ledger' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No ledger entries</TableCell></TableRow>
                ) : ledger.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{entry.catalogItem?.name}</TableCell>
                    <TableCell>{entry.location?.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted">
                        {entry.reason.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-bold ${entry.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.quantityChange > 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                      {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}
                    </TableCell>
                    <TableCell className="text-right font-mono">{entry.runningBalance}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.createdBy?.firstName} {entry.createdBy?.lastName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              currentPage={ledgerPage}
              totalPages={ledgerPages}
              onPageChange={setLedgerPage}
              totalItems={ledgerTotal}
              pageSize={50}
            />
          </CardContent>
        </Card>
      )}

      {/* Adjust Stock Modal */}
      <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustTarget?.catalogItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 inline mr-1" />{adjustTarget?.location?.name} · Current quantity: <span className="font-bold text-foreground">{adjustTarget?.quantity}</span>
            </div>
            <div className="space-y-2">
              <Label>New Quantity</Label>
              <Input
                type="number"
                min={1}
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="e.g. stock-take correction, damaged goods write-off..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
            <Button onClick={handleAdjust} disabled={adjusting || !adjustNotes.trim() || !adjustQuantity || adjustQuantity <= 0}>
              {adjusting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockPage;
