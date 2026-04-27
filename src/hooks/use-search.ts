import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface SearchSuggestionsParams {
    query: string;
    enabled?: boolean;
}

interface SearchResultsParams {
    query: string;
    page: number;
    pageSize?: number;
    enabled?: boolean;
}

// Hook for search suggestions with debouncing
export const useSearchSuggestions = ({ query, enabled = true }: SearchSuggestionsParams) => {
    return useQuery({
        queryKey: ['search-suggestions', query],
        queryFn: async () => {
            if (!query || query.length < 2) return [];
            const response = await axios.get<
                ISearchResult[] | IBackendRes<ISearchResult[] | IModelPaginate<ISearchResult>>
            >(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/search/suggestions`,
                {
                    params: { q: query }
                }
            );
            const payload = response.data;

            if (Array.isArray(payload)) {
                return payload;
            }

            if (Array.isArray(payload?.data)) {
                return payload.data;
            }

            if (Array.isArray(payload?.data?.result)) {
                // return payload.data.result
                return payload?.data!.result
            }

            return [];
        },
        enabled: enabled && query.length >= 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

// Hook for search results with pagination
export const useSearchResults = ({ query, page, pageSize = 10, enabled = true }: SearchResultsParams) => {
    return useQuery({
        queryKey: ['search-results', query, page],
        queryFn: async () => {
            if (!query) return null;
            const response = await axios.get<IBackendRes<IModelPaginate<ITrack>>>(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/search`,
                {
                    params: {
                        q: query,
                        page: page,
                        size: pageSize
                    }
                }
            );
            return response.data;
        },
        enabled: enabled && !!query,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
};
