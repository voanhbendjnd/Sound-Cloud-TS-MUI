'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchResults } from '@/hooks/use-search';
import ProfileTrack from '@/components/track/profile.track';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import SearchBar from '@/components/search/search-bar';

const SearchPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const [page, setPage] = useState(1);
    const [allTracks, setAllTracks] = useState<ITrack[]>([]);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Fetch search results with pagination
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: ['search-results', query],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/search?q=${encodeURIComponent(query)}&page=${pageParam}&size=10`
            );
            const data = await response.json();
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage.data?.meta;
            if (meta && meta.page < meta.pages) {
                return meta.page + 1;
            }
            return undefined;
        },
        enabled: !!query,
    });

    // Update all tracks when data changes
    useEffect(() => {
        if (data?.pages) {
            const tracks = data.pages.flatMap(page => page.data?.result || []);
            setAllTracks(tracks);
        }
    }, [data]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Update URL when query changes
    useEffect(() => {
        if (!query) {
            router.push('/');
        }
    }, [query, router]);

    if (!query) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ mb: 4 }}>
                    Search
                </Typography>
                <SearchBar />
            </Container>
        );
    }

    return (
        <div style={{backgroundColor:'#121212'}}>
            <Container maxWidth="lg" sx={{ py: 4, backgroundColor:'#121212' }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ mb: 2, color:'#fff' }}>
                        Search Results for "{query}"
                    </Typography>
                    {/*<SearchBar />*/}
                </Box>

                {isLoading && allTracks.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : allTracks.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" sx={{color:'white'}}>
                            No results found for "{query}"
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        {allTracks.map((track) => (
                            <Box key={track.id} sx={{ mb: 4 }}>
                                <ProfileTrack track={track} />
                            </Box>
                        ))}

                        {/* Load more trigger */}
                        <div ref={loadMoreRef} style={{ height: 20 }} />

                        {isFetchingNextPage && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}

                        {!hasNextPage && allTracks.length > 0 && (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No more results
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Container>

        </div>
    );
};

export default SearchPage;
