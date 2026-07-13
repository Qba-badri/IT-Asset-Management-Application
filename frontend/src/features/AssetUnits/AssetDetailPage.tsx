import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Tag, MapPin, Calendar, DollarSign, Shield, Clock,
  Settings, FileText, History, Package
} from 'lucide-react';
import { assetUnitsService, AssetUnit } from '../../services/assetUnitsService';
import { AuditEvent } from '../../services/auditEventsService';
import { reportsService, AssetHistory } from '../../services/reportsService';
import { Assignment } from '../../services/assignmentsService';
import { useToast } from '../../context/ToastContext';
import { useCurrency } from '../../context/CurrencyContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

type Tab = 'details' | 'assignments' | 'timeline';

/**
 * AssetDetailPage — Tabbed detail view for a serialized asset unit.
 *
 * Tabs:
 * - Details: specifications, location, warranty, cost info
 * - Assignments: current + past assignments
 * - Timeline: chronological audit events for this asset (from AuditEvent)
 */
const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { formatCost } = useCurrency();

  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<AssetUnit | null>(null);
  const [history, setHistory] = useState<AssetHistory | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [unit, hist] = await Promise.all([
          assetUnitsService.getById(Number(id)),
          reportsService.getAssetHistory(Number(id)),
        ]);
        setAsset(unit);
        setHistory(hist);
      } catch {
        showToast('Failed to load asset details', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading asset details...</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center text-muted-foreground py-12">Asset not found.</div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'details', label: 'Details', icon: <FileText className="w-4 h-4" /> },
    { key: 'assignments', label: 'Assignments', icon: <Package className="w-4 h-4" /> },
    { key: 'timeline', label: 'Timeline', icon: <History className="w-4 h-4" /> },
  ];

  const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'muted'> = {
    in_stock: 'success',
    assigned: 'info',
    in_maintenance: 'warning',
    in_repair: 'warning',
    lost: 'destructive',
    written_off: 'muted',
    disposed: 'muted',
  };

  const actionColor: Record<string, string> = {
    issue: 'text-blue-600 bg-blue-50',
    return: 'text-green-600 bg-green-50',
    partial_return: 'text-yellow-600 bg-yellow-50',
    transfer: 'text-purple-600 bg-purple-50',
    repair_start: 'text-orange-600 bg-orange-50',
    repair_end: 'text-teal-600 bg-teal-50',
    lost: 'text-red-600 bg-red-50',
    write_off: 'text-gray-600 bg-gray-50',
    create: 'text-indigo-600 bg-indigo-50',
    update: 'text-cyan-600 bg-cyan-50',
  };

  const assignmentStatusVariant = (status: string): 'info' | 'success' | 'muted' | 'warning' => {
    if (status === 'active') return 'info';
    if (status === 'returned') return 'success';
    if (status === 'written_off') return 'muted';
    return 'warning';
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="w-fit -mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <PageHeader
        title={asset.assetTag}
        description={`${asset.catalogItem?.name || ''} • ${asset.catalogItem?.sku || ''}`}
      >
        <Badge variant={statusBadgeVariant[asset.status] || 'muted'}>
          {asset.status.replace(/_/g, ' ')}
        </Badge>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Details Tab ──────────────────────────────── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">Identification</h3>
              <InfoRow icon={<Tag />} label="Asset Tag" value={asset.assetTag} />
              <InfoRow icon={<Tag />} label="Serial Number" value={asset.serialNumber || '—'} />
              <InfoRow icon={<Package />} label="Catalog Item" value={asset.catalogItem?.name || '—'} />
              <InfoRow icon={<Tag />} label="SKU" value={asset.catalogItem?.sku || '—'} />
              <InfoRow icon={<Settings />} label="Condition" value={asset.condition} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">Location & Warranty</h3>
              <InfoRow icon={<MapPin />} label="Location" value={asset.location?.name || '—'} />
              <InfoRow icon={<Calendar />} label="Purchase Date" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—'} />
              <InfoRow icon={<DollarSign />} label="Purchase Cost" value={asset.purchaseCost ? formatCost(Number(asset.purchaseCost), asset.currency) : '—'} />
              <InfoRow icon={<Shield />} label="Warranty Expiry" value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '—'} />
              <InfoRow icon={<Clock />} label="Useful Life" value={asset.usefulLifeYears ? `${asset.usefulLifeYears} years` : '—'} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Assignments Tab ──────────────────────────── */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {(!history?.assignments || history.assignments.length === 0) ? (
            <div className="text-center text-muted-foreground py-12">No assignments found</div>
          ) : (
            history.assignments.map((a: Assignment) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        Assignment #{a.id} — {a.assignee?.firstName} {a.assignee?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {new Date(a.createdAt).toLocaleString()} •
                        Qty: {a.returnedQuantity}/{a.quantity} returned
                        {a.dueDate && ` • Due: ${new Date(a.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Badge variant={assignmentStatusVariant(a.status)}>{a.status}</Badge>
                  </div>

                  {/* Return transactions */}
                  {a.returnTransactions && a.returnTransactions.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-green-200 space-y-2">
                      {a.returnTransactions.map((rt) => (
                        <div key={rt.id} className="text-xs text-muted-foreground">
                          Returned {rt.quantity} unit(s) on {new Date(rt.createdAt).toLocaleString()} — Condition: {rt.conditionOnReturn}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ─── Timeline Tab ─────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="space-y-0">
          {(!history?.events || history.events.length === 0) ? (
            <div className="text-center text-muted-foreground py-12">No events recorded</div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted" />

              {history.events.map((event: AuditEvent) => (
                <div key={event.id} className="relative flex items-start gap-4 pb-6">
                  {/* Dot */}
                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${actionColor[event.action] || 'text-muted-foreground bg-muted'
                    }`}>
                    {event.action.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <Card className="flex-1">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor[event.action] || 'bg-muted text-foreground'
                          }`}>
                          {event.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1">
                        {event.actor
                          ? `${event.actor.firstName} ${event.actor.lastName}`
                          : 'System'}{' '}
                        performed <strong>{event.action.replace(/_/g, ' ')}</strong>
                      </p>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <pre className="text-xs bg-muted/40 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Helper Component ─────────────────────────────────────────

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="text-muted-foreground w-4 h-4 flex-shrink-0">{icon}</div>
    <div className="flex-1 flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  </div>
);

export default AssetDetailPage;
