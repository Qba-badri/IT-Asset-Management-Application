import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Tag, MapPin, Calendar, DollarSign, Shield, Clock,
  Settings, AlertTriangle, FileText, History, Package
} from 'lucide-react';
import { assetUnitsService, AssetUnit } from '../../services/assetUnitsService';
import { auditEventsService, AuditEvent } from '../../services/auditEventsService';
import { reportsService, AssetHistory } from '../../services/reportsService';
import { Assignment } from '../../services/assignmentsService';
import { useToast } from '../../context/ToastContext';

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
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-gray-400">Loading asset details...</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 text-center text-gray-500">Asset not found.</div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'details', label: 'Details', icon: <FileText className="w-4 h-4" /> },
    { key: 'assignments', label: 'Assignments', icon: <Package className="w-4 h-4" /> },
    { key: 'timeline', label: 'Timeline', icon: <History className="w-4 h-4" /> },
  ];

  const statusColor: Record<string, string> = {
    in_stock: 'bg-green-100 text-green-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_maintenance: 'bg-yellow-100 text-yellow-800',
    in_repair: 'bg-orange-100 text-orange-800',
    lost: 'bg-red-100 text-red-800',
    written_off: 'bg-gray-100 text-gray-800',
    disposed: 'bg-gray-100 text-gray-500',
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{asset.assetTag}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[asset.status] || 'bg-gray-100'}`}>
              {asset.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {asset.catalogItem?.name} • {asset.catalogItem?.sku}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Details Tab ──────────────────────────────── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Identification</h3>
            <InfoRow icon={<Tag />} label="Asset Tag" value={asset.assetTag} />
            <InfoRow icon={<Tag />} label="Serial Number" value={asset.serialNumber || '—'} />
            <InfoRow icon={<Package />} label="Catalog Item" value={asset.catalogItem?.name || '—'} />
            <InfoRow icon={<Tag />} label="SKU" value={asset.catalogItem?.sku || '—'} />
            <InfoRow icon={<Settings />} label="Condition" value={asset.condition} />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Location & Warranty</h3>
            <InfoRow icon={<MapPin />} label="Location" value={asset.location?.name || '—'} />
            <InfoRow icon={<Calendar />} label="Purchase Date" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—'} />
            <InfoRow icon={<DollarSign />} label="Purchase Cost" value={asset.purchaseCost ? `$${Number(asset.purchaseCost).toFixed(2)}` : '—'} />
            <InfoRow icon={<Shield />} label="Warranty Expiry" value={asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '—'} />
            <InfoRow icon={<Clock />} label="Useful Life" value={asset.usefulLifeYears ? `${asset.usefulLifeYears} years` : '—'} />
          </div>
        </div>
      )}

      {/* ─── Assignments Tab ──────────────────────────── */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {(!history?.assignments || history.assignments.length === 0) ? (
            <div className="text-center text-gray-400 py-12">No assignments found</div>
          ) : (
            history.assignments.map((a: Assignment) => (
              <div key={a.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      Assignment #{a.id} — {a.assignee?.firstName} {a.assignee?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Issued: {new Date(a.createdAt).toLocaleString()} •
                      Qty: {a.returnedQuantity}/{a.quantity} returned
                      {a.dueDate && ` • Due: ${new Date(a.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    a.status === 'returned' ? 'bg-green-100 text-green-800' :
                      a.status === 'written_off' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {a.status}
                  </span>
                </div>

                {/* Return transactions */}
                {a.returnTransactions && a.returnTransactions.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-green-200 space-y-2">
                    {a.returnTransactions.map((rt) => (
                      <div key={rt.id} className="text-xs text-gray-600">
                        Returned {rt.quantity} unit(s) on {new Date(rt.createdAt).toLocaleString()} — Condition: {rt.conditionOnReturn}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Timeline Tab ─────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="space-y-0">
          {(!history?.events || history.events.length === 0) ? (
            <div className="text-center text-gray-400 py-12">No events recorded</div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

              {history.events.map((event: AuditEvent, idx: number) => (
                <div key={event.id} className="relative flex items-start gap-4 pb-6">
                  {/* Dot */}
                  <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${actionColor[event.action] || 'text-gray-600 bg-gray-50'
                    }`}>
                    {event.action.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColor[event.action] || 'bg-gray-100 text-gray-700'
                        }`}>
                        {event.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      {event.actor
                        ? `${event.actor.firstName} ${event.actor.lastName}`
                        : 'System'}{' '}
                      performed <strong>{event.action.replace(/_/g, ' ')}</strong>
                    </p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                          View details
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
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
    <div className="text-gray-400 w-4 h-4 flex-shrink-0">{icon}</div>
    <div className="flex-1 flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  </div>
);

export default AssetDetailPage;
