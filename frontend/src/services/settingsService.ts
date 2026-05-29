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
