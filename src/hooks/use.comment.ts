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
export const useFetchComments = (params: { current: number; pageSize: number; trackId: number; sort?: string }) => {
    return useQuery({
        queryKey: commentKeys.list(params),
        queryFn: async () => {
            const { current, pageSize, trackId, sort } = params;
            return axiosInstance.get<any, IBackendRes<IModelPaginate<IComment>>>(
                `/api/v1/tracks/comments`, {
                    params: {
                        page: current,
                        size: pageSize,
                        trackId: trackId,
                        sort: sort || "updatedAt,desc"
                    }
                }
            );
        },
    });
};
export const useCreateComment = (currentParams: any) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { track_id: number; content: string; moment: number }) =>
            axiosInstance.post('/api/v1/comments', data),

        onMutate: async (newComment) => {
            // Cancel các request fetch đang bay để không bị ghi đè data ảo
            await queryClient.cancelQueries({ queryKey: commentKeys.list(currentParams) });

            // Lưu lại snapshot dữ liệu cũ
            const previousComments = queryClient.getQueryData(commentKeys.list(currentParams));

            // Cập nhật ảo vào Cache
            queryClient.setQueryData(commentKeys.list(currentParams), (old: any) => {
                if (!old) return old;

                // Tạo object comment ảo (khớp với interface IComment của bạn)
                const optimisticComment = {
                    id: Date.now(), // ID tạm
                    content: newComment.content,
                    moment: newComment.moment,
                    createdAt: new Date().toISOString(),
                    user: {
                        name: "You", // Hoặc lấy từ session
                        avatar: null
                    },
                    track: { id: newComment.track_id }
                };

                // Nhét vào đầu mảng result của trang hiện tại
                return {
                    ...old,
                    data: {
                        ...old.data,
                        result: [optimisticComment, ...old.data.result]
                    }
                };
            });

            return { previousComments };
        },

        onError: (err, newComment, context) => {
            // Nếu lỗi thì trả lại data cũ
            if (context?.previousComments) {
                queryClient.setQueryData(commentKeys.list(currentParams), context.previousComments);
            }
        },

        onSettled: () => {
            // Luôn đồng bộ lại với server sau khi xong
            queryClient.invalidateQueries({ queryKey: commentKeys.list(currentParams) });
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
