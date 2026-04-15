import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios-instance';

export const trackKeys = {
    all: ['tracks'] as const,
    lists: () => [...trackKeys.all, 'list'] as const,
    list: (filters: any) => [...trackKeys.lists(), filters] as const,
    details: () => [...trackKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...trackKeys.details(), id] as const,
};

export const useTracks = (params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery({
        queryKey: trackKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            // Map common names to backend expected params (e.g. page instead of current)
            const queryParams = new URLSearchParams();
            queryParams.append('page', current.toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<ITrack>>>(`/api/v1/tracks?${queryParams.toString()}`);
        },
    });
};

export const useTrack = (id: string | number | null) => {
    return useQuery({
        queryKey: trackKeys.detail(id!),
        queryFn: () => axiosInstance.get<any, IBackendRes<ITrack>>(`/api/v1/tracks/${id}`),
        enabled: !!id,
    });
};

export const useCreateTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) => 
            axiosInstance.post('/api/v1/tracks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};
export const useCreateTrackByAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) =>
            axiosInstance.post('/api/v1/tracks/admin', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};


export const useUploadTempTrack = (onUploadProgress?: (progressEvent: any) => void) => {
    return useMutation({
        mutationFn: (formData: FormData) => 
            axiosInstance.post<any, string>('/api/v1/tracks/upload-temp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress
            }),
    });
};

export const useUpdateTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) => 
            axiosInstance.put(`/api/v1/tracks`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.all });
        },
    });
};

export const useDeleteTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => axiosInstance.delete(`/api/v1/tracks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trackKeys.lists() });
        },
    });
};
