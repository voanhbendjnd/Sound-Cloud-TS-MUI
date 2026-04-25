'use client'
import { useHasMounted } from "@/utils/customHook";
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useContext, useEffect, useRef, useState } from "react";
import { TrackContextProvider, useTrackContext } from "@/lib/track.wrapper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FavoriteIcon from '@mui/icons-material/Favorite';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import IconButton from "@mui/material/IconButton";
import AppBar from "@mui/material/AppBar";
import { Container } from "@mui/material";
import ShuffleIcon from '@mui/icons-material/Shuffle';
import axios from "axios";
import Link from "next/link";
import { useLikeTrackMutation } from "@/hooks/use-track";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from 'next/image';
const AppFooter = () => {
    const { currentTrack, setCurrentTrack, audioRef, viewedTracks, markTrackAsViewed } = useTrackContext() as ITrackContext;
    const playerRef = useRef<any>(null);
    const hasMounted = useHasMounted();
    const mutation = useLikeTrackMutation();
    const [isLiked, setIsLiked] = useState<boolean>(currentTrack.isLiked);
    const { data: session } = useSession();
    const keyword = "upload/";

    const index = currentTrack.trackUrl.indexOf(keyword);
      const trackUrlCut = currentTrack.trackUrl.substring(index + keyword.length);

    const handleLikeClick = () => {
        if (session === null) {
            redirect("/auth/signin")
        }
        mutation.mutate(Number(currentTrack.id), {
            onSuccess: (res) => {
                if (res?.data) {
                    setCurrentTrack({
                        ...currentTrack,
                        isLiked: res.data.isLiked
                    });
                }
            }
        });
    };

    useEffect(() => {
        setIsLiked(currentTrack.isLiked);
    }, [currentTrack.id, currentTrack.isLiked]);
    useEffect(() => {
        if (!audioRef.current || !currentTrack.id || !currentTrack.isPlaying) return;

        const handleTimeUpdate = () => {
            const currentTime = audioRef.current?.currentTime || 0;
            const trackId = currentTrack.id.toString();

            // When reaching 30 seconds and track not yet viewed
            if (currentTime >= 30 && !viewedTracks.has(trackId)) {
                // Call API to increase view count
                axios.patch(`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/view/increase`, {
                    trackId: currentTrack.id
                }).catch(err => console.error('Failed to increase view count:', err));

                // Mark track as viewed
                markTrackAsViewed(trackId);
            }
        };

        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
            }
        };
    }, [currentTrack, viewedTracks, markTrackAsViewed]);

    if (!hasMounted) return (<></>)

    if (!currentTrack || !currentTrack.trackUrl) {
        return null;
    }


    return (
        <div style={{ marginTop: 50 }}>
            <AppBar position="fixed" sx={{ top: 'auto', bottom: 0, background: "#282828", borderTop: '1px solid #111' }}>
                <Container sx={{ display: "flex", gap: 3, alignItems: "center", py: 1, maxWidth: 'xl' }}>

                    {/* Audio Player */}
                    <Box sx={{
                        flexGrow: 1,
                        display: 'flex',
                        minWidth: 0,
                        '& .rhap_container': {
                            background: 'transparent',
                            boxShadow: 'none',
                            padding: '0 15px 0 0',
                            width: '100%',
                        },
                        '& .rhap_progress-section': {
                            display: 'flex',
                            alignItems: 'center',
                            flexGrow: 1,
                            gap: '12px'
                        },
                        '& .rhap_main-controls': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        },
                        '& .rhap_main-controls-button': {
                            color: 'white',
                            fontSize: '28px',
                        },
                        '& .rhap_play-pause-button': {
                            fontSize: '45px',
                            color: 'white',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            '& svg': {
                                fontSize: '28px'
                            }
                        },
                        '& .rhap_time': { color: '#ccc', fontSize: '12px', fontWeight: 'bold' },
                        '& .rhap_progress-container': {
                            flexGrow: 1,
                            margin: '0',
                        },
                        '& .rhap_progress-bar': { backgroundColor: '#555', height: '4px' },
                        '& .rhap_progress-filled': { backgroundColor: '#f50' },
                        '& .rhap_progress-indicator': {
                            backgroundColor: '#f50',
                            boxShadow: 'none',
                            width: '12px',
                            height: '12px',
                            top: '-4px'
                        },
                        '& .rhap_volume-container': {
                            flex: '0 0 auto',
                        },
                        '& .rhap_volume-button': { color: '#ccc' },
                        '& .rhap_volume-bar-area': { display: 'none' }, // Hid volume bar to match screenshot minimalism, or keep it if preferred
                        '& .rhap_repeat-button': { color: '#ccc', fontSize: '22px' },
                    }}>
                        <AudioPlayer
                            ref={(c) => {
                                playerRef.current = c;
                                if (c && c.audio.current) {
                                    audioRef.current = c.audio.current;
                                    audioRef.current.preload = 'none';
                                }
                            }}
                            autoPlay={false}
                            showSkipControls={true}
                            showJumpControls={false}
                            src={`${currentTrack.trackUrl}`}
                            volume={0.5}
                            preload="none"
                            onPlay={() => setCurrentTrack({ ...currentTrack, isPlaying: true })}
                            onPause={() => setCurrentTrack({ ...currentTrack, isPlaying: false })}
                            customProgressBarSection={[
                                RHAP_UI.MAIN_CONTROLS,
                                <ShuffleIcon key="shuffle" sx={{ color: '#ccc', fontSize: 22, mx: 0.5, cursor: 'pointer', '&:hover': { color: 'white' } }} />,
                                RHAP_UI.LOOP,
                                RHAP_UI.CURRENT_TIME,
                                RHAP_UI.PROGRESS_BAR,
                                RHAP_UI.DURATION,
                                RHAP_UI.VOLUME,
                            ]}
                            customControlsSection={[]}
                            customVolumeControls={[]}
                            customAdditionalControls={[]}
                        />
                    </Box>

                    {/* Track Info (Right Side) */}
                    <Box sx={{ display: "flex", alignItems: "center", minWidth: 280, maxWidth: 300 }}>
                        <Box sx={{ width: 40, height: 40, mr: 1.5, flexShrink: 0, backgroundColor: '#444' }}>
                            <Link href={`/track/${currentTrack.id}?audio=${trackUrlCut}&id=${currentTrack.id}`} style={{ textDecoration: 'none' }}>

                                {currentTrack.imgUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <Image
                                        src={`${currentTrack.imgUrl}`}
                                        alt={currentTrack.title}
                                        width={40}
                                        height={40}
                                        style={{
                                            objectFit: 'cover', // Giúp ảnh không bị móp méo, tự động cắt trung tâm
                                            borderRadius: '4px' // Thêm bo góc cho đẹp giống SoundCloud
                                        }}
                                        unoptimized={true} // Bật cái này nếu link Cloudinary đã tự tối ưu rồi
                                    />
                                )}
                            </Link>
                        </Box>

                        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: 'hidden' }}>
                            {/* Link tới Profile */}
                            <Link href={`/profile/${currentTrack.uploader.id}`} style={{ textDecoration: 'none' }}>
                                <Typography
                                    noWrap
                                    sx={{
                                        color: "#aaa",
                                        fontSize: 11,
                                        mb: 0.2,
                                        '&:hover': {
                                            color: "white", // Chữ sáng lên khi hover
                                            fontSize:'bold'
                                            // textDecoration: "underline" // Gạch chân nếu muốn
                                        }
                                    }}
                                >
                                    {currentTrack.uploader?.name || "Unknown"}
                                </Typography>
                            </Link>

                            {/* Link tới Track */}
                            <Link href={`/track/${currentTrack.id}?audio=${trackUrlCut}&id=${currentTrack.id}`} style={{ textDecoration: 'none' }}>
                                <Typography
                                    noWrap
                                    sx={{
                                        color: "white",
                                        fontSize: 13,
                                        fontWeight: 'bold',
                                        transition: "color 0.2s ease", // Giúp hiệu ứng đổi màu mượt hơn
                                        '&:hover': {
                                            color: "#f50", // Đổi sang màu cam đặc trưng của SoundCloud
                                        }
                                    }}
                                >
                                    {currentTrack.title || "No Track Selected"}
                                </Typography>
                            </Link>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            <IconButton
                                size="small"
                                onClick={handleLikeClick}
                                disabled={mutation.isPending}
                                sx={{
                                    color: '#ccc',
                                    p: 0.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'scale(1.2)', // Hiệu ứng động đậy khi đưa chuột vào
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                            >
                                <FavoriteIcon
                                    sx={{
                                        fontSize: 'inherit',
                                        color: currentTrack.isLiked ? '#f64a00' : 'inherit',
                                        transition: 'color 0.2s ease'
                                    }}
                                />
                            </IconButton>
                            <IconButton size="small" sx={{ color: '#ccc', p: 0.5 }}>
                                <PersonAddIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" sx={{ color: '#ccc', p: 0.5 }}>
                                <PlaylistAddIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                </Container>
            </AppBar>
        </div>
    )
}

export default AppFooter;