import api from './apiClient';

export const settingsService = {
  getSetting: async (key: string): Promise<{ key: string, value: string }> => {
    const response = await api.get(`/settings/${key}`);
    return response.data;
  },

  updateSetting: async (key: string, value: string): Promise<any> => {
    const response = await api.put(`/settings/${key}`, { value });
    return response.data;
  },
};

export interface IntegrationSetting {
  key: string;
  label: string;
  integration: 'azure' | 'qpeople' | 'smtp';
  isSecret: boolean;
  configured: boolean;
  source: 'database' | 'environment' | null;
  value: string | null;
  updatedAt: string | null;
}

export const integrationSettingsService = {
  list: async (): Promise<IntegrationSetting[]> => {
    const response = await api.get('/settings/integrations');
    return response.data;
  },

  // Pass null/empty to clear a stored value (falls back to env var, if any)
  update: async (entries: Record<string, string | null>): Promise<IntegrationSetting[]> => {
    const response = await api.put('/settings/integrations', entries);
    return response.data;
  },

  testSmtpConnection: async (email?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/settings/integrations/smtp/test', { email });
    return response.data;
  },
};
