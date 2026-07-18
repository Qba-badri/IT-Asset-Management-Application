import api from './apiClient';

export type NotificationCategory =
  | 'asset_warranty_expiry'
  | 'license_expiry'
  | 'low_stock'
  | 'assignment_status_change';

export type RecipientType = 'assigned_user' | 'department_admin' | 'static_email' | 'user_id';

export interface NotificationRecipient {
  id: number;
  notificationType: NotificationCategory;
  recipientType: RecipientType;
  recipientValue: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationRecipientDto {
  notificationType: NotificationCategory;
  recipientType: RecipientType;
  recipientValue?: string;
  isActive?: boolean;
}

export interface UpdateNotificationRecipientDto {
  recipientValue?: string;
  isActive?: boolean;
}

export const notificationRecipientsService = {
  list: async (type?: NotificationCategory): Promise<NotificationRecipient[]> => {
    const response = await api.get('/notifications/recipients', { params: type ? { type } : {} });
    return response.data;
  },

  create: async (dto: CreateNotificationRecipientDto): Promise<NotificationRecipient> => {
    const response = await api.post('/notifications/recipients', dto);
    return response.data;
  },

  update: async (id: number, dto: UpdateNotificationRecipientDto): Promise<NotificationRecipient> => {
    const response = await api.put(`/notifications/recipients/${id}`, dto);
    return response.data;
  },

  remove: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/recipients/${id}`);
    return response.data;
  },
};

export type TemplateKey =
  | 'WARRANTY_EXPIRY'
  | 'LICENSE_EXPIRY'
  | 'LOW_STOCK'
  | 'ASSIGNMENT'
  | 'STATUS_CHANGE';

export interface NotificationTemplate {
  key: TemplateKey;
  label: string;
  subject: string;
  bodyHtml: string;
  placeholders: string[];
  isCustomized: boolean;
  updatedAt: string | null;
}

export const notificationTemplatesService = {
  list: async (): Promise<NotificationTemplate[]> => {
    const response = await api.get('/notifications/templates');
    return response.data;
  },

  update: async (key: TemplateKey, dto: { subject: string; bodyHtml: string }): Promise<NotificationTemplate> => {
    const response = await api.put(`/notifications/templates/${key}`, dto);
    return response.data;
  },

  reset: async (key: TemplateKey): Promise<NotificationTemplate> => {
    const response = await api.post(`/notifications/templates/${key}/reset`);
    return response.data;
  },

  sendTest: async (key: TemplateKey, email?: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/notifications/templates/${key}/test`, { email });
    return response.data;
  },
};
