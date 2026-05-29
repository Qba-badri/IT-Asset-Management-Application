import api from './apiClient';

export interface ChatResponse {
  response: {
    type: 'text' | 'markdown';
    text: string;
  };
}

export const botService = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    const response = await api.post('/bot/chat', { message });
    return response.data;
  },
};
