'use client'

import { useState } from 'react';
import { Container, Typography, Box, TextField, Grid, Pagination, CircularProgress } from '@mui/material';
import { usePlaylistsPaginated } from '@/hooks/use-playlist';
import PlaylistCard from '@/components/playlist/playlist-card';
import {Metadata} from "next";

const PlaylistPage = () => {
    const [searchTitle, setSearchTitle] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 12;

    const { data, isLoading } = usePlaylistsPaginated({
        title: searchTitle || undefined,
        page,
        size: pageSize
    });
    //@ts-ignore
    const playlists = data?.data?.result ?? [];
    //@ts-ignore
    const meta = data?.data?.meta;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTitle(e.target.value);
        setPage(1); // Reset to page 1 when search changes
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 4 }}>
            <Container maxWidth="lg">
                <Typography variant="h4" sx={{ color: '#fff', mb: 3, fontWeight: 600,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,          // 🔥 giới hạn 2 dòng
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '48px',          // 🔥 fix chiều cao luôn
                }}>
                    Playlists
                </Typography>

                {/* Search Input */}
                <Box sx={{ mb: 4 }}>
                    <TextField
                        fullWidth
                        placeholder="Search playlists..."
                        value={searchTitle}
                        onChange={handleSearchChange}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#2a2a2a',
                                color: '#fff',
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
                                '&.Mui-focused fieldset': { borderColor: '#f50' },
                            },
                            '& .MuiInputBase-input': {
                                color: '#fff',
                            }
                        }}
                    />
                </Box>

                {/* Loading State */}
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#f50' }} />
                    </Box>
                )}

                {/* Playlist Grid */}
                {!isLoading && (
                    <>
                        {playlists.length > 0 ? (
                            <Grid container spacing={3}>
                                {playlists.map((playlist) => (
                                    <Grid item xs={12} sm={6} md={4} lg={2} xl={2} key={playlist.id}>
                                        <PlaylistCard playlist={playlist} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography sx={{ color: '#666', fontSize: '1.2rem' }}>
                                    {searchTitle ? 'No playlists found' : 'No playlists yet'}
                                </Typography>
                            </Box>
                        )}

                        {/* Pagination */}
                        {meta && meta.pages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                                <Pagination
                                    count={meta.pages}
                                    page={page}
                                    onChange={handlePageChange}
                                    color="primary"
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            color: '#fff',
                                            bgcolor: '#2a2a2a',
                                            '&:hover': {
                                                bgcolor: '#333',
                                            },
                                            '&.Mui-selected': {
                                                bgcolor: '#f50',
                                                '&:hover': {
                                                    bgcolor: '#e40',
                                                },
                                            },
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Container>
        </Box>
    );
};

export default PlaylistPage;