import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Loader2, Mail, Save, RotateCcw, Send, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import {
    notificationRecipientsService,
    notificationTemplatesService,
    NotificationRecipient,
    NotificationTemplate,
    NotificationCategory,
    RecipientType,
    TemplateKey,
} from '../../services/notificationService';
import {
    Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label,
} from '../../components/ui';
import { Badge } from '../../components/ui/badge';

// ─── Recipients tab ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<NotificationCategory, string> = {
    asset_warranty_expiry: 'Asset Warranty Expiry',
    license_expiry: 'License Expiry',
    low_stock: 'Low Stock',
    assignment_status_change: 'Assignment / Status Change',
};

const RECIPIENT_TYPE_LABELS: Record<RecipientType, string> = {
    assigned_user: 'Assigned User',
    department_admin: 'Department Admin',
    static_email: 'Static Email',
    user_id: 'User ID',
};

const NEEDS_VALUE: RecipientType[] = ['static_email', 'user_id'];

function NotificationRecipients() {
    const { showToast } = useToast();
    const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingFor, setAddingFor] = useState<NotificationCategory | null>(null);
    const [newType, setNewType] = useState<RecipientType>('assigned_user');
    const [newValue, setNewValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            setRecipients(await notificationRecipientsService.list());
        } catch (error: any) {
            showToast(error.friendlyMessage || 'Failed to load recipients', 'error');
        } finally {
            setLoading(false);
        }
    };

    const grouped = useMemo(() => {
        const map: Record<NotificationCategory, NotificationRecipient[]> = {
            asset_warranty_expiry: [],
            license_expiry: [],
            low_stock: [],
            assignment_status_change: [],
        };
        recipients.forEach(r => { map[r.notificationType]?.push(r); });
        return map;
    }, [recipients]);

    const startAdd = (category: NotificationCategory) => {
        setAddingFor(category);
        setNewType('assigned_user');
        setNewValue('');
    };

    const handleAdd = async (category: NotificationCategory) => {
        if (NEEDS_VALUE.includes(newType) && !newValue.trim()) {
            showToast('A value is required for this recipient type', 'error');
            return;
        }
        try {
            setSaving(true);
            const created = await notificationRecipientsService.create({
                notificationType: category,
                recipientType: newType,
                recipientValue: NEEDS_VALUE.includes(newType) ? newValue.trim() : undefined,
            });
            setRecipients(prev => [...prev, created]);
            setAddingFor(null);
            showToast('Recipient added', 'success');
        } catch (error: any) {
            showToast(error.friendlyMessage || 'Failed to add recipient', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (id: number) => {
        try {
            setDeletingId(id);
            await notificationRecipientsService.remove(id);
            setRecipients(prev => prev.filter(r => r.id !== id));
            showToast('Recipient removed', 'success');
        } catch (error: any) {
            showToast(error.friendlyMessage || 'Failed to remove recipient', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    return (
        <>
            {(Object.keys(CATEGORY_META) as NotificationCategory[]).map(category => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle>{CATEGORY_META[category]}</CardTitle>
                        <CardDescription>Who receives this notification's emails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {grouped[category].length === 0 && (
                            <p className="text-sm text-muted-foreground">No recipients configured.</p>
                        )}
                        {grouped[category].map(r => (
                            <div key={r.id} className="flex items-center justify-between rounded-md border border-input px-3 py-2">
                                <div className="text-sm">
                                    <span className="font-medium">{RECIPIENT_TYPE_LABELS[r.recipientType]}</span>
                                    {r.recipientValue && <span className="text-muted-foreground"> — {r.recipientValue}</span>}
                                    {!r.isActive && <Badge variant="secondary" className="ml-2">Inactive</Badge>}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(r.id)}
                                    disabled={deletingId === r.id}
                                >
                                    {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        ))}

                        {addingFor === category ? (
                            <div className="flex flex-wrap items-end gap-2 pt-2">
                                <div className="space-y-1">
                                    <Label htmlFor={`recipient-type-${category}`}>Recipient Type</Label>
                                    <select
                                        id={`recipient-type-${category}`}
                                        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        value={newType}
                                        onChange={e => setNewType(e.target.value as RecipientType)}
                                    >
                                        {(Object.keys(RECIPIENT_TYPE_LABELS) as RecipientType[]).map(t => (
                                            <option key={t} value={t}>{RECIPIENT_TYPE_LABELS[t]}</option>
                                        ))}
                                    </select>
                                </div>
                                {NEEDS_VALUE.includes(newType) && (
                                    <div className="space-y-1">
                                        <Label htmlFor={`recipient-value-${category}`}>
                                            {newType === 'static_email' ? 'Email address' : 'User ID'}
                                        </Label>
                                        <Input
                                            id={`recipient-value-${category}`}
                                            value={newValue}
                                            onChange={e => setNewValue(e.target.value)}
                                            placeholder={newType === 'static_email' ? 'someone@example.com' : '123'}
                                        />
                                    </div>
                                )}
                                <Button onClick={() => handleAdd(category)} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Add
                                </Button>
                                <Button variant="outline" onClick={() => setAddingFor(null)} disabled={saving}>Cancel</Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => startAdd(category)}>
                                <Plus className="h-4 w-4 mr-2" /> Add recipient
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))}
        </>
    );
}

// ─── Email Templates tab ────────────────────────────────────────────────────

const QUILL_MODULES = {
    toolbar: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
    ],
};

function samplePreview(bodyHtml: string, subject: string, placeholders: string[]): { subject: string; body: string } {
    const sample: Record<string, string> = {
        assetTag: 'LAP-001', assetName: 'Sample Laptop', warrantyExpiry: new Date().toLocaleDateString(),
        daysRemaining: '7', licenseName: 'Sample Software License', expiryDate: new Date().toLocaleDateString(),
        itemName: 'USB Cable', currentStock: '2', minStockLevel: '5', reorderPoint: '10',
        entityType: 'asset', entityName: 'Sample Laptop', action: 'assigned', verb: 'Assigned',
        performedBy: 'Admin User', oldStatus: 'AVAILABLE', newStatus: 'IN_REPAIR',
    };
    const substitute = (tpl: string) => tpl.replace(/\{\{(\w+)\}\}/g, (_, token) => sample[token] ?? '');
    return { subject: substitute(subject), body: substitute(bodyHtml) };
}

function TemplateCard({ template, onSaved }: { template: NotificationTemplate; onSaved: (t: NotificationTemplate) => void }) {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [subject, setSubject] = useState(template.subject);
    const [bodyHtml, setBodyHtml] = useState(template.bodyHtml);
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [testing, setTesting] = useState(false);

    const dirty = subject !== template.subject || bodyHtml !== template.bodyHtml;

    const insertPlaceholder = (token: string) => {
        setBodyHtml(prev => `${prev}{{${token}}}`);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updated = await notificationTemplatesService.update(template.key, { subject, bodyHtml });
            onSaved(updated);
            showToast('Template saved', 'success');
        } catch (error: any) {
            showToast(error.friendlyMessage || 'Failed to save template', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        try {
            setResetting(true);
            const reset = await notificationTemplatesService.reset(template.key);
            setSubject(reset.subject);
            setBodyHtml(reset.bodyHtml);
            onSaved(reset);
            showToast('Reverted to default', 'success');
        } catch (error: any) {
            showToast(error.friendlyMessage || 'Failed to reset template', 'error');
        } finally {
            setResetting(false);
        }
    };

    const handleTest = async () => {
        try {
            setTesting(true);
            const result = await notificationTemplatesService.sendTest(template.key, user?.email);
            showToast(result.message || 'Test email sent', 'success');
        } catch (error: any) {
            showToast(error.friendlyMessage || 'Failed to send test email', 'error');
        } finally {
            setTesting(false);
        }
    };

    const previewData = useMemo(() => samplePreview(bodyHtml, subject, template.placeholders), [bodyHtml, subject, template.placeholders]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-500" />
                    {template.label}
                    <Badge variant={template.isCustomized ? 'success' : 'secondary'}>
                        {template.isCustomized ? 'Customized' : 'Default'}
                    </Badge>
                </CardTitle>
                <CardDescription>Key: {template.key}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor={`subject-${template.key}`}>Subject</Label>
                    <Input
                        id={`subject-${template.key}`}
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <Label>Available placeholders</Label>
                    <div className="flex flex-wrap gap-2">
                        {template.placeholders.map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => insertPlaceholder(p)}
                                className="rounded-full border border-input bg-muted px-2 py-0.5 text-xs font-mono hover:bg-accent"
                            >
                                {`{{${p}}}`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label>Body</Label>
                        <Button variant="ghost" size="sm" onClick={() => setPreview(p => !p)}>
                            {preview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                            {preview ? 'Edit' : 'Preview'}
                        </Button>
                    </div>
                    {preview ? (
                        <div className="rounded-md border border-input p-4 bg-background">
                            <p className="text-sm font-semibold mb-2">{previewData.subject}</p>
                            <div className="text-sm" dangerouslySetInnerHTML={{ __html: previewData.body }} />
                        </div>
                    ) : (
                        <ReactQuill theme="snow" value={bodyHtml} onChange={setBodyHtml} modules={QUILL_MODULES} />
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={!dirty || saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                    </Button>
                    <Button variant="outline" onClick={handleReset} disabled={!template.isCustomized || resetting}>
                        {resetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                        Reset to Default
                    </Button>
                    <Button variant="outline" onClick={handleTest} disabled={testing}>
                        {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Send Test
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function EmailTemplates() {
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            setTemplates(await notificationTemplatesService.list());
        } catch (error: any) {
            showToast(error.friendlyMessage || 'Failed to load email templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaved = (updated: NotificationTemplate) => {
        setTemplates(prev => prev.map(t => (t.key === updated.key ? updated : t)));
    };

    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    return (
        <>
            {templates.map(template => (
                <TemplateCard key={template.key} template={template} onSaved={handleSaved} />
            ))}
        </>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────

type TabId = 'recipients' | 'templates';

export default function NotificationSettings() {
    const [tab, setTab] = useState<TabId>('recipients');

    return (
        <div className="space-y-4">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                <button
                    type="button"
                    onClick={() => setTab('recipients')}
                    className={`inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${tab === 'recipients' ? 'bg-background text-foreground shadow-sm' : ''}`}
                >
                    Recipients
                </button>
                <button
                    type="button"
                    onClick={() => setTab('templates')}
                    className={`inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${tab === 'templates' ? 'bg-background text-foreground shadow-sm' : ''}`}
                >
                    Email Templates
                </button>
            </div>

            {tab === 'recipients' ? <NotificationRecipients /> : <EmailTemplates />}
        </div>
    );
}
