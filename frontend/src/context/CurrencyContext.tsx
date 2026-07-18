import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { settingsService } from '../services/settingsService';
import { currencyService, CurrencyRate } from '../services/currencyService';

const BASE_CURRENCY_CODE = 'INR';
const DISPLAY_CURRENCY_STORAGE_KEY = 'displayCurrency';

// Static fallback: used for record-currency dropdowns and when GET /api/currencies fails.
const FALLBACK_SYMBOLS: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'AED ',
};

const FALLBACK_BASE_ONLY: CurrencyRate[] = [{
    id: 0, code: BASE_CURRENCY_CODE, name: 'Indian Rupee', symbol: '₹', rateToBase: 1, isActive: true, updatedAt: '',
}];

interface CurrencyContextType {
    /** The user's selected display currency (full record). */
    selectedCurrency: CurrencyRate;
    /** Active currencies available in the navbar switcher. */
    availableCurrencies: CurrencyRate[];
    /** Org-wide default currency (DEFAULT_CURRENCY setting); records default to this in forms. */
    defaultCurrency: string;
    /** Symbol for an arbitrary currency code (falls back to the code itself). */
    symbolFor: (code: string) => string;
    /** Converts an amount between two arbitrary currencies via the INR rate table. */
    convertBetween: (amount: number, from: string, to: string) => number;
    /** Formats an amount in an arbitrary currency (no conversion): symbol + locale grouping, 2 decimals. */
    formatInCurrency: (amount: number, code: string) => string;
    currencySymbol: string;
    currencyCode: string;
    /** rates[code] = "1 [code] = X INR". INR is always 1. */
    rates: Record<string, number>;
    /** Sets the user's display currency and persists it to localStorage (per-user). */
    setCurrency: (code: string) => void;
    /** Converts a stored amount (in sourceCurrency, default INR) into the display currency. */
    convert: (amount: number, sourceCurrency?: string) => number;
    /** convert() + symbol + locale-aware grouping, 2 decimals (₹12,34,567.00 / $12,345.00). */
    format: (amount: number, sourceCurrency?: string) => string;
    /** convert() + 1-decimal abbreviation: ₹1.5Cr / ₹25L for INR, $1.5M / $250K otherwise. */
    formatCompact: (amount: number, sourceCurrency?: string) => string;
    /** Alias of format() — kept for existing consumers. */
    formatCost: (amount: number, sourceCurrency?: string) => string;
    /** Formats an amount already expressed in the display currency (e.g. backend-converted aggregates) — no further conversion. */
    formatDisplayAmount: (amount: number) => string;
    /** Re-fetches active currencies + org default. Call after login — the endpoints are auth-guarded, so the fetch on app mount (login screen) yields the base-only fallback. */
    reloadCurrencies: () => void;
    isLoading: boolean;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const localeFor = (code: string) => (code === 'INR' ? 'en-IN' : 'en-US');

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyRate[]>(FALLBACK_BASE_ONLY);
    const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });
    const [currencyCode, setCurrencyCodeState] = useState(BASE_CURRENCY_CODE);
    const [defaultCurrency, setDefaultCurrency] = useState(BASE_CURRENCY_CODE);
    const [isLoading, setIsLoading] = useState(true);

    const reloadCurrencies = useCallback(() => {
        setIsLoading(true);
        Promise.all([
            currencyService.getActive(),
            // Org-wide default, used when the user has no personal preference
            settingsService.getSetting('DEFAULT_CURRENCY').catch(() => null),
        ])
            .then(([currencies, defaultSetting]) => {
                const active = currencies.length > 0 ? currencies : FALLBACK_BASE_ONLY;
                setAvailableCurrencies(active);

                // Rate table covers every returned currency; refreshed each app load
                const rateMap: Record<string, number> = {};
                active.forEach(c => { rateMap[c.code] = Number(c.rateToBase) || 1; });
                rateMap[BASE_CURRENCY_CODE] = 1;
                setRates(rateMap);

                const isSelectable = (code: string | null | undefined) =>
                    !!code && active.some(c => c.code === code);

                const orgDefaultCode = defaultSetting?.value;
                setDefaultCurrency(isSelectable(orgDefaultCode) ? orgDefaultCode! : BASE_CURRENCY_CODE);

                const stored = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
                if (isSelectable(stored)) {
                    setCurrencyCodeState(stored!);
                } else {
                    // Stale/inactive personal preference — clear it and fall back
                    if (stored) localStorage.removeItem(DISPLAY_CURRENCY_STORAGE_KEY);
                    const orgDefault = defaultSetting?.value;
                    setCurrencyCodeState(isSelectable(orgDefault) ? orgDefault! : BASE_CURRENCY_CODE);
                }
            })
            .catch(() => { /* currency fetch failed — stay on base-currency-only, don't block the UI */ })
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        // Skip the initial fetch on the login screen (no token → guaranteed 401);
        // AppShell calls reloadCurrencies() once the user is authenticated.
        if (localStorage.getItem('token')) {
            reloadCurrencies();
        } else {
            setIsLoading(false);
        }
    }, [reloadCurrencies]);

    const setCurrency = useCallback((code: string) => {
        setCurrencyCodeState(code);
        localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, code);
    }, []);

    const selectedCurrency = useMemo(
        () =>
            availableCurrencies.find(c => c.code === currencyCode) ??
            { ...FALLBACK_BASE_ONLY[0], code: currencyCode, symbol: FALLBACK_SYMBOLS[currencyCode] || currencyCode + ' ' },
        [availableCurrencies, currencyCode],
    );

    const currencySymbol = selectedCurrency.symbol || FALLBACK_SYMBOLS[currencyCode] || currencyCode + ' ';

    const rateFor = useCallback((code: string) => rates[code] ?? 1, [rates]);

    const symbolFor = useCallback((code: string) => {
        const record = availableCurrencies.find(c => c.code === code);
        return record?.symbol || FALLBACK_SYMBOLS[code] || code + ' ';
    }, [availableCurrencies]);

    const convertBetween = useCallback((amount: number, from: string, to: string) => {
        if (from === to) return amount;
        return (amount * rateFor(from)) / rateFor(to);
    }, [rateFor]);

    const formatInCurrency = useCallback((amount: number, code: string) => {
        return `${symbolFor(code)}${amount.toLocaleString(localeFor(code), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [symbolFor]);

    // Converts a stored amount from its own record currency (sourceCurrency,
    // defaulting to the base INR for legacy records with none) through INR
    // into the selected display currency.
    const convert = useCallback((amount: number, sourceCurrency: string = BASE_CURRENCY_CODE) => {
        const amountInInr = amount * rateFor(sourceCurrency);
        return currencyCode === BASE_CURRENCY_CODE ? amountInInr : amountInInr / rateFor(currencyCode);
    }, [currencyCode, rateFor]);

    const formatDisplayAmount = useCallback((amount: number) => {
        return `${currencySymbol}${amount.toLocaleString(localeFor(currencyCode), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [currencySymbol, currencyCode]);

    const format = useCallback((amount: number, sourceCurrency: string = BASE_CURRENCY_CODE) => {
        return formatDisplayAmount(convert(amount, sourceCurrency));
    }, [convert, formatDisplayAmount]);

    const formatCompact = useCallback((amount: number, sourceCurrency: string = BASE_CURRENCY_CODE) => {
        const converted = convert(amount, sourceCurrency);
        const sign = converted < 0 ? '-' : '';
        const abs = Math.abs(converted);
        const oneDecimal = (n: number) =>
            n.toLocaleString(localeFor(currencyCode), { minimumFractionDigits: 0, maximumFractionDigits: 1 });

        // Indian numbering for INR (Cr/L), short scale (B/M/K) for everything else
        const units: [number, string][] = currencyCode === 'INR'
            ? [[1e7, 'Cr'], [1e5, 'L'], [1e3, 'K']]
            : [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
        for (const [divisor, suffix] of units) {
            if (abs >= divisor) return `${sign}${currencySymbol}${oneDecimal(abs / divisor)}${suffix}`;
        }
        return `${sign}${currencySymbol}${oneDecimal(abs)}`;
    }, [convert, currencyCode, currencySymbol]);

    return (
        <CurrencyContext.Provider value={{
            selectedCurrency,
            availableCurrencies,
            defaultCurrency,
            symbolFor,
            convertBetween,
            formatInCurrency,
            currencySymbol,
            currencyCode,
            rates,
            setCurrency,
            convert,
            format,
            formatCompact,
            formatCost: format,
            formatDisplayAmount,
            reloadCurrencies,
            isLoading,
            loading: isLoading,
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

// Static list for record-currency dropdowns (which currency a purchase was made in)
export const CURRENCY_OPTIONS = Object.keys(FALLBACK_SYMBOLS);
export const BASE_CURRENCY = BASE_CURRENCY_CODE;
