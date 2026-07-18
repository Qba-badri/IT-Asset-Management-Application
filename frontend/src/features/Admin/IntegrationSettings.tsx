import React, { useEffect, useMemo, useState } from 'react';
import { Cloud, Loader2, Mail, PlugZap, Save, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
    integrationSettingsService,
    IntegrationSetting,
} from '../../services/settingsService';
import { userService } from '../../services/userService';
import {
    Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label,
} from '../../components/ui';
import { Badge } from '../../components/ui/badge';

type IntegrationId = 'azure' | 'qpeople' | 'smtp';

const INTEGRATION_META: Record<IntegrationId, { title: string; description: string; icon: React.ReactNode }> = {
    azure: {
        title: 'Azure AD',
        description: 'Sync users from Microsoft Entra ID (Azure AD) via Microsoft Graph. Requires an app registration with User.Read.All application permission.',
        icon: <Cloud className="h-5 w-5 text-sky-500" />,
    },
    qpeople: {
        title: 'QPeople HRMS',
        description: 'Sync employees (name, email, department, designation, reporting manager) from the QPeople HR system.',
        icon: <Users className="h-5 w-5 text-emerald-500" />,
    },
    smtp: {
        title: 'Email (SMTP)',
        description: 'Used to send password-reset codes and asset/license/inventory notification emails. Leaving these unset falls back to the server\'s .env configuration.',
        icon: <Mail className="h-5 w-5 text-amber-500" />,
    },
};

type SmtpProvider = 'gmail' | 'outlook' | 'yahoo' | 'custom';

const SMTP_PROVIDER_PRESETS: Record<Exclude<SmtpProvider, 'custom'>, { host: string; port: string; secure: string }> = {
    gmail: { host: 'smtp.gmail.com', port: '587', secure: 'false' },
    outlook: { host: 'smtp.office365.com', port: '587', secure: 'false' },
    yahoo: { host: 'smtp.mail.yahoo.com', port: '587', secure: 'false' },
};

const SMTP_PROVIDER_LABELS: Record<SmtpProvider, string> = {
    gmail: 'Gmail',
    outlook: 'Outlook (Office 365)',
    yahoo: 'Yahoo',
    custom: 'Custom',
};

export default function IntegrationSettings() {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<IntegrationSetting[]>([]);
    const [loading, setLoading] = useState(true);
    // Draft values keyed by setting key; only keys the admin edited are sent
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<IntegrationId | null>(null);
    const [testing, setTesting] = useState<IntegrationId | null>(null);
    const [syncing, setSyncing] = useState<IntegrationId | null>(null);
    const [smtpProvider, setSmtpProvider] = useState<SmtpProvider>('custom');

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await integrationSettingsService.list();
            // A backend running pre-integrations code answers this route via the
            // generic /settings/:key handler with an object — don't crash on it.
            if (!Array.isArray(data)) {
                throw new Error('Integrations API unavailable — restart the backend to load the new code.');
            }
            setSettings(data);
            setDrafts({});
        } catch (error: any) {
            showToast(error.response?.data?.message || error.message || 'Failed to load integration settings', 'error');
            setSettings([]);
        } finally {
            setLoading(false);
        }
    };

    const grouped = useMemo(() => ({
        azure: settings.filter(s => s.integration === 'azure'),
        qpeople: settings.filter(s => s.integration === 'qpeople'),
        smtp: settings.filter(s => s.integration === 'smtp'),
    }), [settings]);

    const handleSave = async (integration: IntegrationId) => {
        const keys = grouped[integration].map(s => s.key);
        const entries: Record<string, string> = {};
        for (const key of keys) {
            if (drafts[key] !== undefined) entries[key] = drafts[key];
        }
        if (Object.keys(entries).length === 0) return;
        try {
            setSaving(integration);
            setSettings(await integrationSettingsService.update(entries));
            setDrafts(prev => {
                const next = { ...prev };
                keys.forEach(k => delete next[k]);
                return next;
            });
            showToast(`${INTEGRATION_META[integration].title} settings saved`, 'success');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to save settings', 'error');
        } finally {
            setSaving(null);
        }
    };

    const handleTest = async (integration: IntegrationId) => {
        try {
            setTesting(integration);
            const result = integration === 'azure'
                ? await userService.testAzureConnection()
                : integration === 'qpeople'
                    ? await userService.testQPeopleConnection()
                    : await integrationSettingsService.testSmtpConnection();
            showToast(result.message || 'Connection successful', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Connection failed', 'error');
        } finally {
            setTesting(null);
        }
    };

    const handleSync = async (integration: 'azure' | 'qpeople') => {
        try {
            setSyncing(integration);
            const result = integration === 'azure'
                ? await userService.syncAzureUsers()
                : await userService.syncQPeopleUsers();
            showToast(`Sync complete. Created: ${result.createdCount}, updated: ${result.updatedCount}`, 'success');
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Sync failed', 'error');
        } finally {
            setSyncing(null);
        }
    };

    const handleSmtpProviderChange = (provider: SmtpProvider) => {
        setSmtpProvider(provider);
        if (provider === 'custom') return;
        const preset = SMTP_PROVIDER_PRESETS[provider];
        setDrafts(prev => ({
            ...prev,
            SMTP_HOST: preset.host,
            SMTP_PORT: preset.port,
            SMTP_SECURE: preset.secure,
        }));
    };

    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    }

    return (
        <>
            {(['azure', 'qpeople', 'smtp'] as IntegrationId[]).map(integration => {
                const meta = INTEGRATION_META[integration];
                const fields = grouped[integration];
                const configured = fields.length > 0 && fields.every(f => f.configured);
                const dirty = fields.some(f => drafts[f.key] !== undefined);
                const isSmtp = integration === 'smtp';
                return (
                    <Card key={integration}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {meta.icon}
                                {meta.title}
                                <Badge variant={configured ? 'success' : 'secondary'}>
                                    {configured ? 'Configured' : 'Not configured'}
                                </Badge>
                            </CardTitle>
                            <CardDescription>{meta.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isSmtp && (
                                <div className="space-y-1 max-w-xs">
                                    <Label htmlFor="smtp-provider">Provider preset</Label>
                                    <select
                                        id="smtp-provider"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        value={smtpProvider}
                                        onChange={e => handleSmtpProviderChange(e.target.value as SmtpProvider)}
                                    >
                                        {(Object.keys(SMTP_PROVIDER_LABELS) as SmtpProvider[]).map(p => (
                                            <option key={p} value={p}>{SMTP_PROVIDER_LABELS[p]}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Selecting a provider fills in the host/port/security fields below. Fill in your username, password, and from address, then save.
                                    </p>
                                </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
                                {fields.map(field => (
                                    <div key={field.key} className="space-y-1">
                                        <Label htmlFor={field.key}>{field.label}</Label>
                                        <Input
                                            id={field.key}
                                            type={field.isSecret ? 'password' : 'text'}
                                            autoComplete="off"
                                            placeholder={field.configured ? (field.value || '') : `Enter ${field.label.toLowerCase()}...`}
                                            value={drafts[field.key] ?? (field.isSecret ? '' : field.value || '')}
                                            onChange={e => setDrafts(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        />
                                        {field.configured && (
                                            <p className="text-xs text-muted-foreground">
                                                {field.source === 'environment' ? 'Currently set via environment variable' : 'Stored encrypted in database'}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={() => handleSave(integration)} disabled={!dirty || saving === integration}>
                                    {saving === integration ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save
                                </Button>
                                <Button variant="outline" onClick={() => handleTest(integration)} disabled={testing === integration}>
                                    {testing === integration ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlugZap className="h-4 w-4 mr-2" />}
                                    Test Connection
                                </Button>
                                {!isSmtp && (
                                    <Button variant="outline" onClick={() => handleSync(integration as 'azure' | 'qpeople')} disabled={syncing === integration || !configured}>
                                        {syncing === integration ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Cloud className="h-4 w-4 mr-2" />}
                                        Sync Users Now
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </>
    );
}
