import api from './api';

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

export const visitService = {
    getStats: async () => {
        const response = await api.get('/visits/stats');
        return response.data;
    },

    getAllVisits: async (page: number = 1, limit: number = 10, startDate?: string, endDate?: string) => {
        const params: any = { page, limit };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get<PaginatedResponse<any>>('/visits', { params });
        return response.data;
    },

    checkIn: async (qrCode: string) => {
        const response = await api.post('/visits/check-in', { qrCode });
        return response.data;
    },

    checkInByCode: async (accessCode: string) => {
        const response = await api.post('/visits/check-in-code', { accessCode });
        return response.data;
    }
};
