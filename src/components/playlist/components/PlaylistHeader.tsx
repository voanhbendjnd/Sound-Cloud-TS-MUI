import { Grid, Box, Typography, Chip } from '@mui/material';
import Image from 'next/image';

interface IProps {
    playlist: IPlaylist;
}

const PlaylistHeader = ({ playlist }: IProps) => {
    const displayImage = playlist?.imgUrl || (playlist?.playlistTracks?.[0]?.imgUrl) || null;

    return (
        <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
                <Box sx={{ position: 'relative', aspectRatio: '1/1', bgcolor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                    {displayImage ? (
                        <Image
                            src={displayImage}
                            alt={playlist.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                        />
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography sx={{ color: '#444', fontSize: 64 }}>🎵</Typography>
                        </Box>
                    )}
                </Box>
            </Grid>
            <Grid item xs={12} md={8}>
                <Typography variant="caption" sx={{ color: '#f50', textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                    Playlist
                </Typography>
                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                    {playlist.title}
                </Typography>
                {playlist.description && (
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                        {playlist.description}
                    </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#999' }}>
                        By {playlist.user?.name || 'Unknown'}
                    </Typography>
                    <Chip
                        label={`${playlist.totalTracks} tracks`}
                        size="small"
                        sx={{ bgcolor: '#333', color: '#ccc' }}
                    />
                    <Chip
                        label={playlist.isPublic ? 'PUBLIC' : 'PRIVATE'}
                        size="small"
                        sx={{
                            bgcolor: playlist.isPublic ? '#f50' : '#333',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};

export default PlaylistHeader;
