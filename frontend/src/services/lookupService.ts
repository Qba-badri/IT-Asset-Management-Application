import apiClient from './apiClient';

export interface Location {
  id: number;
  name: string;
  address?: string;
  building?: string;
  floor?: string;
  room?: string;
  isActive: boolean;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  costCenter?: string;
  isActive: boolean;
}

export const locationsService = {
  async getAll(): Promise<Location[]> {
    const response = await apiClient.get<Location[]>('/api/locations');
    return response.data;
  },
  async create(data: Partial<Location>): Promise<Location> {
    const response = await apiClient.post<Location>('/api/locations', data);
    return response.data;
  },
  async update(id: number, data: Partial<Location>): Promise<Location> {
    const response = await apiClient.put<Location>(`/api/locations/${id}`, data);
    return response.data;
  },
};

export const departmentsService = {
  async getAll(): Promise<Department[]> {
    const response = await apiClient.get<Department[]>('/api/departments');
    return response.data;
  },
  async create(data: Partial<Department>): Promise<Department> {
    const response = await apiClient.post<Department>('/api/departments', data);
    return response.data;
  },
  async update(id: number, data: Partial<Department>): Promise<Department> {
    const response = await apiClient.put<Department>(`/api/departments/${id}`, data);
    return response.data;
  },
};
