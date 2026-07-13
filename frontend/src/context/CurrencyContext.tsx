import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settingsService';

const CURRENCY_SYMBOLS: Record<string, string> = {
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

const BASE_CURRENCY_CODE = 'INR';

interface CurrencyContextType {
    currencySymbol: string;
    currencyCode: string;
    /** rates[code] = "1 [code] = X INR". INR is always 1. */
    rates: Record<string, number>;
    /** Converts a stored amount from its own record currency into the display currency. */
    formatCost: (amount: number, sourceCurrency?: string) => string;
    /** Formats an amount that's already expressed in the display currency (e.g. backend-converted aggregates) — no further conversion. */
    formatDisplayAmount: (amount: number) => string;
    setCurrencyCode: (code: string) => Promise<void>;
    setRates: (rates: Record<string, number>) => Promise<void>;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currencyCode, setCurrencyCodeState] = useState(BASE_CURRENCY_CODE);
    const [rates, setRatesState] = useState<Record<string, number>>({ INR: 1 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            settingsService.getSetting('DEFAULT_CURRENCY'),
            settingsService.getSetting('EXCHANGE_RATES'),
        ])
            .then(([currencyRes, ratesRes]) => {
                if (currencyRes?.value && CURRENCY_SYMBOLS[currencyRes.value]) {
                    setCurrencyCodeState(currencyRes.value);
                }
                if (ratesRes?.value) {
                    try {
                        const parsed = JSON.parse(ratesRes.value);
                        if (parsed && typeof parsed === 'object') {
                            setRatesState({ ...parsed, INR: 1 });
                        }
                    } catch { /* ignore malformed rate table, fall back to default */ }
                }
            })
            .catch(() => { /* fall back to base currency, empty rate table */ })
            .finally(() => setLoading(false));
    }, []);

    const setCurrencyCode = useCallback(async (code: string) => {
        await settingsService.updateSetting('DEFAULT_CURRENCY', code);
        setCurrencyCodeState(code);
    }, []);

    const setRates = useCallback(async (newRates: Record<string, number>) => {
        const normalized = { ...newRates, INR: 1 };
        await settingsService.updateSetting('EXCHANGE_RATES', JSON.stringify(normalized));
        setRatesState(normalized);
    }, []);

    const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode + ' ';

    const rateFor = (code: string) => rates[code] ?? 1;

    // Converts a stored amount from its own record currency (sourceCurrency,
    // defaulting to the base INR for legacy records with none) through INR
    // into the selected display currency.
    const formatCost = (amount: number, sourceCurrency: string = BASE_CURRENCY_CODE) => {
        const amountInInr = amount * rateFor(sourceCurrency);
        const converted = currencyCode === BASE_CURRENCY_CODE ? amountInInr : amountInInr / rateFor(currencyCode);
        return `${currencySymbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDisplayAmount = (amount: number) => {
        return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currencySymbol, currencyCode, rates, formatCost, formatDisplayAmount, setCurrencyCode, setRates, loading }}>
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

export const CURRENCY_OPTIONS = Object.keys(CURRENCY_SYMBOLS);
export const BASE_CURRENCY = BASE_CURRENCY_CODE;
