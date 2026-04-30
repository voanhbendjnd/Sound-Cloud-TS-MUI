'use client'

import { Box, Typography, Card, CardMedia, CardContent, Chip } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';

interface PlaylistCardProps {
    playlist: IPlaylist;
}

const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
    return (
        <Link href={`/playlist/${playlist.id}`} style={{ textDecoration: 'none' }}>
            <Card
                sx={{
                    bgcolor: '#2a2a2a',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                        bgcolor: '#333',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }
                }}
            >
                <Box sx={{ position: 'relative', aspectRatio: '1/1', bgcolor: '#1a1a1a' }}>
                    {playlist.imgUrl ? (
                        <Image
                            src={playlist.imgUrl}
                            alt={playlist.title}
                            width={180}
                            height={170}
                            style={{
                                objectFit: 'cover', // Giúp ảnh không bị móp méo, tự động cắt trung tâm
                                borderRadius: '4px' // Thêm bo góc cho đẹp giống SoundCloud
                            }}
                            unoptimized={true} // Bật cái này nếu link Cloudinary đã tự tối ưu rồi
                        />
                    ) : (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#1a1a1a'
                            }}
                        >
                            <PlaylistAddIcon sx={{ fontSize: 64, color: '#444' }} />
                        </Box>
                    )}
                </Box>
                <CardContent sx={{ p: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 600,
                            color: '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5
                        }}
                    >
                        {playlist.title}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#999',
                            display: 'block',
                            mb: 1
                        }}
                    >
                        By {playlist.createdBy || playlist.user?.name || 'Unknown'}
                    </Typography>
                    <Chip
                        label={`${playlist.totalTracks} tracks`}
                        size="small"
                        sx={{
                            bgcolor: '#333',
                            color: '#ccc',
                            fontSize: '0.75rem',
                            height: 24
                        }}
                    />
                </CardContent>
            </Card>
        </Link>
    );
};

export default PlaylistCard;
