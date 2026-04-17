import {categoryKeys} from "@/hooks/use-category";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import axiosInstance from "@/utils/axios-instance";

export const commentKeys ={
    all:['comments'] as const,
    lists:()=> [...commentKeys.all, 'comments'] as const,
    list:(filters: any)=> [...categoryKeys.lists(), filters] as const,

};

export const useComments = (params: { current: number; pageSize: number; filter?: string; sort?: string }) => {
    return useQuery({
        queryKey: commentKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, filter, sort } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', current.toString());
            queryParams.append('size', pageSize.toString());
            if (filter) queryParams.append('filter', filter);
            if (sort) queryParams.append('sort', sort);

            return axiosInstance.get<any, IBackendRes<IModelPaginate<IComment>>>(`/api/v1/comments?${queryParams.toString()}`);
        },
    });
};
export const useCreateComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { track_id:number; content:string; moment:number }) =>
            axiosInstance.post('/api/v1/comments', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
        },
    });
};

export const useDeleteComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => axiosInstance.delete(`/api/v1/comments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
        },
    });
};
