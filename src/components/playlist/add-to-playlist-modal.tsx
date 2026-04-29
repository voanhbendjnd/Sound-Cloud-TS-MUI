'use client';

import { useState } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Divider,
    Chip,
    CircularProgress,
    Switch,
    Tabs,
    Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { usePlaylists, useCreatePlaylist, useToggleTrackInPlaylist } from '@/hooks/use-playlist';
import { toast } from 'react-toastify';

interface AddToPlaylistModalProps {
    open: boolean;
    onClose: () => void;
    trackId: number;
}

const AddToPlaylistModal = ({ open, onClose, trackId }: AddToPlaylistModalProps) => {
    // 0: Add to playlist, 1: Create a playlist
    const [tabValue, setTabValue] = useState(0);

    const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    const { data: playlists, isLoading } = usePlaylists();
    const createPlaylistMutation = useCreatePlaylist();
    const toggleTrackMutation = useToggleTrackInPlaylist();

    const handleCreatePlaylist = async () => {
        if (!newPlaylistTitle.trim()) {
            toast.error('Playlist title is required');
            return;
        }

        try {
            await createPlaylistMutation.mutateAsync({
                title: newPlaylistTitle,
                description: newPlaylistDescription,
                isPublic,
                trackIds: [trackId]
            });
            toast.success('Playlist created successfully');
            setNewPlaylistTitle('');
            setNewPlaylistDescription('');
            setIsPublic(false);
            setTabValue(0); // Quay lại tab danh sách sau khi tạo xong
        } catch (error) {
            toast.error('Failed to create playlist');
        }
    };

    const handleToggleTrack = async (playlistId: number, isAdded: boolean) => {
        try {
            await toggleTrackMutation.mutateAsync({
                playlistId,
                trackId,
                isAdded: !isAdded
            });
            toast.success(isAdded ? 'Track removed from playlist' : 'Track added to playlist');
        } catch (error) {
            toast.error('Failed to update playlist');
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <Box
                sx={{
                    bgcolor: '#1a1a1a', // Tông đen sâu hơn giống ảnh
                    color: '#fff',
                    width: '100%',
                    maxWidth: 500,
                    borderRadius: 1,
                    p: 0, // p=0 để thanh Tab sát lề
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header với Tabs */}
                <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, val) => setTabValue(val)}
                        TabIndicatorProps={{ style: { backgroundColor: '#f50', height: 2 } }}
                        sx={{
                            '& .MuiTab-root': {
                                color: '#999',
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                minWidth: 'auto',
                                mr: 3,
                                px: 0,
                                '&.Mui-selected': { color: '#fff' }
                            }
                        }}
                    >
                        <Tab label="Add to playlist" />
                        <Tab label="Create a playlist" />
                    </Tabs>
                    <IconButton onClick={onClose} sx={{ color: '#999', mt: 0.5 }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: '#333' }} />

                {/* Nội dung thay đổi theo Tab */}
                <Box sx={{ p: 3, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                    {tabValue === 0 ? (
                        /* TAB 1: DANH SÁCH PLAYLIST */
                        <>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress sx={{ color: '#f50' }} />
                                </Box>
                            ) : playlists && playlists.length > 0 ? (
                                playlists.map((playlist) => {
                                    const isAdded = playlist.trackIds?.includes(trackId);
                                    return (
                                        <Box
                                            key={playlist.id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 1.5,
                                                mb: 1,
                                                borderRadius: 1,
                                                '&:hover': { bgcolor: '#2a2a2a' },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ width: 40, height: 40, bgcolor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <PlaylistAddIcon sx={{ color: '#666' }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {playlist.title}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                                        {playlist.totalTracks} tracks
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleToggleTrack(playlist.id, isAdded)}
                                                sx={{
                                                    borderColor: isAdded ? '#f50' : '#444',
                                                    color: isAdded ? '#fff' : '#ccc',
                                                    bgcolor: isAdded ? '#f50' : 'transparent',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        borderColor: isAdded ? '#e40' : '#666',
                                                        bgcolor: isAdded ? '#e40' : 'rgba(255,255,255,0.05)',
                                                    },
                                                }}
                                            >
                                                {isAdded ? 'Added' : 'Add to playlist'}
                                            </Button>
                                        </Box>
                                    );
                                })
                            ) : (
                                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 4 }}>
                                    No playlists yet.
                                </Typography>
                            )}
                        </>
                    ) : (
                        /* TAB 2: FORM TẠO MỚI */
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#ccc', display: 'block', mb: 0.5 }}>
                                    Playlist title <span style={{ color: '#f50' }}>*</span>
                                </Typography>
                                <TextField
                                    value={newPlaylistTitle}
                                    onChange={(e) => setNewPlaylistTitle(e.target.value)}
                                    fullWidth
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#2a2a2a',
                                            color: '#fff',
                                            '& fieldset': { borderColor: '#444' },
                                            '&:hover fieldset': { borderColor: '#666' },
                                            '&.Mui-focused fieldset': { borderColor: '#f50' },
                                        }
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Typography variant="body2" sx={{ color: '#ccc' }}>Privacy:</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <input
                                            type="radio"
                                            checked={isPublic}
                                            onChange={() => setIsPublic(true)}
                                            style={{ accentColor: '#f50' }}
                                        />
                                        <Typography variant="body2">Public</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <input
                                            type="radio"
                                            checked={!isPublic}
                                            onChange={() => setIsPublic(false)}
                                            style={{ accentColor: '#f50' }}
                                        />
                                        <Typography variant="body2">Private</Typography>
                                    </Box>
                                </Box>

                                <Button
                                    variant="contained"
                                    onClick={handleCreatePlaylist}
                                    disabled={createPlaylistMutation.isPending}
                                    sx={{
                                        bgcolor: '#fff',
                                        color: '#000',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        '&:hover': { bgcolor: '#eee' },
                                        '&.Mui-disabled': { bgcolor: '#444', color: '#888' }
                                    }}
                                >
                                    Save
                                </Button>
                            </Box>

                            <Divider sx={{ borderColor: '#333', my: 1 }} />

                            {/* Phần Footer mô phỏng giống ảnh */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                Looking for more tracks? Add some from your likes.
                            </Typography>
                            <Box sx={{ color: '#666', fontSize: '0.85rem' }}>
                                (Your recently liked tracks would appear here)
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default AddToPlaylistModal;