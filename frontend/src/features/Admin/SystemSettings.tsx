import React, { useState, useEffect } from 'react';
import { Save, Loader2, Coins } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCurrency, CURRENCY_OPTIONS, BASE_CURRENCY } from '../../context/CurrencyContext';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '../../components/ui';

export default function SystemSettings() {
    const { showToast } = useToast();
    const { currencyCode, rates, setCurrencyCode, setRates } = useCurrency();
    const [currencyDraft, setCurrencyDraft] = useState(currencyCode);
    const [ratesDraft, setRatesDraft] = useState<Record<string, number>>(rates);
    const [savingCurrency, setSavingCurrency] = useState(false);

    useEffect(() => {
        setCurrencyDraft(currencyCode);
    }, [currencyCode]);

    useEffect(() => {
        setRatesDraft(rates);
    }, [rates]);

    const currencyDirty =
        currencyDraft !== currencyCode ||
        CURRENCY_OPTIONS.some(code => (ratesDraft[code] ?? 1) !== (rates[code] ?? 1));

    const handleSaveCurrency = async () => {
        try {
            setSavingCurrency(true);
            await setCurrencyCode(currencyDraft);
            await setRates(ratesDraft);
            showToast('Currency settings updated', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update currency', 'error');
        } finally {
            setSavingCurrency(false);
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
                            Every asset, license and purchase is tagged with its own currency. Maintain an exchange rate for each currency (1 unit = ? {BASE_CURRENCY}) so records convert correctly to whatever display currency you pick below — a $50 purchase and a ₹50 purchase will no longer show as the same value.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 max-w-xs">
                            <Label htmlFor="currency">Display Currency</Label>
                            <select
                                id="currency"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={currencyDraft}
                                onChange={(e) => setCurrencyDraft(e.target.value)}
                            >
                                {CURRENCY_OPTIONS.map(code => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Exchange Rates</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl">
                                {CURRENCY_OPTIONS.filter(code => code !== BASE_CURRENCY).map(code => (
                                    <div key={code} className="space-y-1">
                                        <Label htmlFor={`rate-${code}`} className="text-xs text-muted-foreground font-normal">
                                            1 {code} = ? {BASE_CURRENCY}
                                        </Label>
                                        <Input
                                            id={`rate-${code}`}
                                            type="number"
                                            min={0}
                                            step="0.0001"
                                            value={ratesDraft[code] ?? ''}
                                            onChange={(e) => setRatesDraft(prev => ({ ...prev, [code]: parseFloat(e.target.value) || 0 }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex pt-2">
                            <Button onClick={handleSaveCurrency} disabled={savingCurrency || !currencyDirty}>
                                {savingCurrency ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Currency
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
