import React, { createContext, useContext, useState } from 'react';

interface CurrencyContextType {
    currencySymbol: string;
    currencyCode: string;
    formatCost: (amount: number) => string;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Default currency settings (can be made configurable later via environment variables)
    const [currencySymbol] = useState('₹');
    const [currencyCode] = useState('INR');
    const [loading] = useState(false);

    const formatCost = (amount: number) => {
        return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currencySymbol, currencyCode, formatCost, loading }}>
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
