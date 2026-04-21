'use client'

import { useState, useEffect, useRef } from 'react';
import { sendRequest } from "@/utils/api";
import ProfileTrack from "@/components/track/profile.track";
import { Container, Typography, Box } from "@mui/material";
import {useSession} from "next-auth/react";

const ProfilePage = ({ params }: { params: { slug: string } }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [allTracks, setAllTracks] = useState<ITrack[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<HTMLDivElement | null>(null);
    const {data:session} = useSession();
    // Fetch tracks for current page
    useEffect(() => {
        const fetchTracks = async () => {
            setIsLoading(true);
            try {
                const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
                    url: `http://localhost:8080/api/v1/tracks/users/${params.slug}?page=${currentPage}&size=10`,
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                });

                const newTracks = res?.data?.result ?? [];
                const meta = res?.data?.meta;

                // Append new tracks to existing list
                setAllTracks(prev => {
                    // Avoid duplicates
                    const existingIds = new Set(prev.map(t => t.id));
                    const filtered = newTracks.filter(t => !existingIds.has(t.id));
                    return [...prev, ...filtered];
                });

                // Update total and hasMore
                if (meta) {
                    setTotal(meta.total);
                    setHasMore(meta.page < meta.pages);
                }
            } catch (error) {
                console.error('Error fetching tracks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTracks();
    }, [currentPage, params.slug]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    setCurrentPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading]);

    return (
        <Box sx={{ minHeight: '100vh', background: '#222', py: 4 }}>
            <Container maxWidth="md">
                <Typography sx={{ color: '#999', mb: 3, fontWeight: 'bold' }}>
                    Found {total} tracks
                </Typography>
                <Box>
                    {allTracks.map(track => (
                        <ProfileTrack key={track.id} track={track} />
                    ))}
                    {allTracks.length === 0 && !isLoading && (
                        <Typography sx={{ color: '#666', mt: 4 }}>Chưa có bài hát nào được tải lên.</Typography>
                    )}

                    {/* Loading indicator */}
                    {isLoading && (
                        <Box sx={{ textAlign: 'center', py: 2, color: '#999' }}>
                            Loading more tracks...
                        </Box>
                    )}

                    {/* Observer target for infinite scroll */}
                    {hasMore && !isLoading && (
                        <div ref={observerRef} style={{ height: '20px' }} />
                    )}

                    {!hasMore && allTracks.length > 0 && (
                        <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', mt: 2 }}>
                            No more tracks
                        </Typography>
                    )}
                </Box>
            </Container>
        </Box>
    )
}

export default ProfilePage;