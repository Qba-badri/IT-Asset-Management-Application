import React, { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, Coins, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { BASE_CURRENCY } from '../../context/CurrencyContext';
import { currencyService, CurrencyRate } from '../../services/currencyService';
import { settingsService } from '../../services/settingsService';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '../../components/ui';
import { FormField } from '../../components/shared/FormField';
import { useForm } from '../../hooks/useForm';
import IntegrationSettings from './IntegrationSettings';

interface CurrencyDraft {
    rateToBase: string;
    isActive: boolean;
}

export default function SystemSettings() {
    const { showToast } = useToast();

    const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
    const [drafts, setDrafts] = useState<Record<number, CurrencyDraft>>({});
    const [defaultCurrency, setDefaultCurrency] = useState(BASE_CURRENCY);
    const [defaultDraft, setDefaultDraft] = useState(BASE_CURRENCY);
    const [loading, setLoading] = useState(true);
    const [savingCurrency, setSavingCurrency] = useState(false);

    // Add-currency form
    const [showAdd, setShowAdd] = useState(false);
    const {
        values: addForm,
        errors: addErrors,
        handleChange: handleAddChange,
        handleBlur: handleAddBlur,
        validateForm: validateAddForm,
        resetForm: resetAddForm,
    } = useForm({ code: '', name: '', symbol: '', rateToBase: '' }, {
        code: {
            label: 'Currency code',
            required: true,
            custom: (v) => (String(v).trim().length !== 3 ? 'Currency code must be exactly 3 letters.' : null),
        },
        name: { label: 'Currency name', required: true },
        symbol: { label: 'Symbol', required: true },
        rateToBase: {
            label: 'Rate',
            required: true,
            custom: (v) => (!(parseFloat(v) > 0) ? 'Rate must be greater than zero.' : null),
        },
    });
    const [adding, setAdding] = useState(false);

    const toDrafts = (list: CurrencyRate[]) =>
        Object.fromEntries(list.map(c => [c.id, { rateToBase: String(c.rateToBase), isActive: c.isActive }]));

    const load = useCallback(async () => {
        try {
            const [list, defaultSetting] = await Promise.all([
                currencyService.getAll(),
                settingsService.getSetting('DEFAULT_CURRENCY').catch(() => null),
            ]);
            setCurrencies(list);
            setDrafts(toDrafts(list));
            const def = defaultSetting?.value || BASE_CURRENCY;
            setDefaultCurrency(def);
            setDefaultDraft(def);
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to load currencies', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { load(); }, [load]);

    const isDirty = (c: CurrencyRate) => {
        const d = drafts[c.id];
        if (!d) return false;
        return parseFloat(d.rateToBase) !== Number(c.rateToBase) || d.isActive !== c.isActive;
    };

    const currencyDirty = defaultDraft !== defaultCurrency || currencies.some(isDirty);

    const handleSaveCurrency = async () => {
        try {
            setSavingCurrency(true);
            const changed = currencies.filter(isDirty);
            for (const c of changed) {
                const d = drafts[c.id];
                await currencyService.update(c.id, {
                    rateToBase: parseFloat(d.rateToBase) || Number(c.rateToBase),
                    isActive: d.isActive,
                });
            }
            if (defaultDraft !== defaultCurrency) {
                await settingsService.updateSetting('DEFAULT_CURRENCY', defaultDraft);
            }
            showToast('Currency settings updated', 'success');
            await load();
        } catch (error: any) {
            showToast(error?.response?.data?.message || error.message || 'Failed to update currency', 'error');
        } finally {
            setSavingCurrency(false);
        }
    };

    const handleAddCurrency = async () => {
        if (!validateAddForm()) return;
        try {
            setAdding(true);
            await currencyService.create({
                code: addForm.code.trim().toUpperCase(),
                name: addForm.name.trim(),
                symbol: addForm.symbol.trim(),
                rateToBase: parseFloat(addForm.rateToBase),
            });
            showToast(`Currency ${addForm.code.toUpperCase()} added`, 'success');
            resetAddForm({ code: '', name: '', symbol: '', rateToBase: '' });
            setShowAdd(false);
            await load();
        } catch (error: any) {
            showToast(error?.response?.data?.message || 'Failed to add currency', 'error');
        } finally {
            setAdding(false);
        }
    };


    return (
        <div className="space-y-6">
            <PageHeader
                title="System Settings"
                description="Manage global application settings and integrations"
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-amber-500" />
                            Currency
                        </CardTitle>
                        <CardDescription>
                            Every asset, license and purchase is tagged with its own currency. Maintain an exchange rate for each currency (1 unit = ? {BASE_CURRENCY}) so records convert correctly. Active currencies appear in each user's display-currency switcher in the top bar; the default below applies to users who haven't picked one.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading currencies…
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 max-w-xs">
                                    <Label htmlFor="currency">Default Display Currency</Label>
                                    <select
                                        id="currency"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={defaultDraft}
                                        onChange={(e) => setDefaultDraft(e.target.value)}
                                    >
                                        {currencies.filter(c => drafts[c.id]?.isActive ?? c.isActive).map(c => (
                                            <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Exchange Rates</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
                                        {currencies.filter(c => c.code !== BASE_CURRENCY).map(c => (
                                            <div key={c.id} className="space-y-1 rounded-md border p-3">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor={`rate-${c.code}`} className="text-xs text-muted-foreground font-normal">
                                                        {c.symbol} {c.code} — 1 {c.code} = ? {BASE_CURRENCY}
                                                    </Label>
                                                    <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={drafts[c.id]?.isActive ?? c.isActive}
                                                            onChange={(e) => setDrafts(prev => ({
                                                                ...prev,
                                                                [c.id]: { ...prev[c.id], isActive: e.target.checked },
                                                            }))}
                                                        />
                                                        Active
                                                    </label>
                                                </div>
                                                <Input
                                                    id={`rate-${c.code}`}
                                                    type="number"
                                                    min={0}
                                                    step="0.0001"
                                                    value={drafts[c.id]?.rateToBase ?? ''}
                                                    onChange={(e) => setDrafts(prev => ({
                                                        ...prev,
                                                        [c.id]: { ...prev[c.id], rateToBase: e.target.value },
                                                    }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {showAdd ? (
                                    <div className="space-y-3 rounded-md border p-4 max-w-3xl">
                                        <Label>Add Currency</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
                                            <FormField id="currency-code" label="Code" required error={addErrors.code}>
                                                <Input placeholder="Code (e.g. CHF)" maxLength={3} value={addForm.code}
                                                    onChange={(e) => handleAddChange('code', e.target.value.toUpperCase())}
                                                    onBlur={() => handleAddBlur('code')} />
                                            </FormField>
                                            <FormField id="currency-name" label="Name" required error={addErrors.name}>
                                                <Input placeholder="Name" value={addForm.name}
                                                    onChange={(e) => handleAddChange('name', e.target.value)}
                                                    onBlur={() => handleAddBlur('name')} />
                                            </FormField>
                                            <FormField id="currency-symbol" label="Symbol" required error={addErrors.symbol}>
                                                <Input placeholder="Symbol" maxLength={10} value={addForm.symbol}
                                                    onChange={(e) => handleAddChange('symbol', e.target.value)}
                                                    onBlur={() => handleAddBlur('symbol')} />
                                            </FormField>
                                            <FormField id="currency-rate" label="Rate" required error={addErrors.rateToBase}>
                                                <Input placeholder={`1 unit = ? ${BASE_CURRENCY}`} type="number" min={0} step="0.0001" value={addForm.rateToBase}
                                                    onChange={(e) => handleAddChange('rateToBase', e.target.value)}
                                                    onBlur={() => handleAddBlur('rateToBase')} />
                                            </FormField>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleAddCurrency} disabled={adding}>
                                                {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                                Add
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { resetAddForm({ code: '', name: '', symbol: '', rateToBase: '' }); setShowAdd(false); }}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Currency
                                    </Button>
                                )}

                                <div className="flex pt-2">
                                    <Button onClick={handleSaveCurrency} disabled={savingCurrency || !currencyDirty}>
                                        {savingCurrency ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Save Currency
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <IntegrationSettings />
            </div>
        </div>
    );
}
