import api from './apiClient';

/** Rate semantics: rateToBase = "1 [code] = X INR" (INR is the base, always 1). */
export interface CurrencyRate {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rateToBase: number | string;
  isActive: boolean;
  updatedAt: string;
}

export const currencyService = {
  /** Active currencies only — feeds the navbar switcher for all users. */
  getActive: async (): Promise<CurrencyRate[]> => {
    const response = await api.get('/api/currencies');
    return response.data;
  },

  /** Admin (settings.manage): full list including inactive. */
  getAll: async (): Promise<CurrencyRate[]> => {
    const response = await api.get('/api/currencies/all');
    return response.data;
  },

  create: async (data: {
    code: string;
    name: string;
    symbol: string;
    rateToBase: number;
    isActive?: boolean;
  }): Promise<CurrencyRate> => {
    const response = await api.post('/api/currencies', data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<{ name: string; symbol: string; rateToBase: number; isActive: boolean }>,
  ): Promise<CurrencyRate> => {
    const response = await api.put(`/api/currencies/${id}`, data);
    return response.data;
  },
};
