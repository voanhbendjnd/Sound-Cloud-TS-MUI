'use client'
import { useHasMounted } from "@/utils/customHook";
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import React, { useContext, useEffect, useRef, useState } from "react";
import { TrackContextProvider, useTrackContext } from "@/lib/track.wrapper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FavoriteIcon from '@mui/icons-material/Favorite';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import IconButton from "@mui/material/IconButton";
import AppBar from "@mui/material/AppBar";
import { Container, useMediaQuery, useTheme } from "@mui/material";
import ShuffleIcon from '@mui/icons-material/Shuffle';
import axiosInstance from "@/utils/axios-instance";
import Link from "next/link";
import { useLikeTrackMutation } from "@/hooks/use-track";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { useSession } from "next-auth/react";
import Image from 'next/image';
import AddToPlaylistModal from "@/components/playlist/add-to-playlist-modal";
import { generateProfileUrl, generateTrackUrlUp } from "@/utils/generate.slug";
import CustomYouTubePlayer from "./custom.youtube.player";
import Drawer from "@mui/material/Drawer";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import {redirect, useRouter} from "next/navigation";
import H5AudioPlayer from "react-h5-audio-player";

const AppFooter = () => {
    const { currentTrack, setCurrentTrack, audioRef, viewedTracks, markTrackAsViewed, playNextTrack, playPreviousTrack } = useTrackContext() as ITrackContext;
    const playerRef = useRef<any>(null);
    const hasMounted = useHasMounted();

    const audioRefPro = useRef<H5AudioPlayer>(null);
    const mutation = useLikeTrackMutation();
    const [isLiked, setIsLiked] = useState<boolean>(currentTrack.isLiked);
    const { data: session } = useSession();
    const keyword = "upload/";
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showMobileDrawer, setShowMobileDrawer] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const index = currentTrack.trackUrl ? currentTrack.trackUrl.indexOf(keyword) : -1;
    const trackUrlCut = index !== -1 ? currentTrack.trackUrl.substring(index + keyword.length) : currentTrack.trackUrl;

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    };

    // Sync footer play/pause with audio element state
    useEffect(() => {
        if (audioRef.current && !currentTrack.isYoutube) {
            const audio = audioRef.current;

            const updatePlayState = () => {
                if (audio.paused !== !currentTrack.isPlaying) {
                    setCurrentTrack({ ...currentTrack, isPlaying: !audio.paused });
                }
            };

            audio.addEventListener('play', updatePlayState);
            audio.addEventListener('pause', updatePlayState);

            return () => {
                audio.removeEventListener('play', updatePlayState);
                audio.removeEventListener('pause', updatePlayState);
            };
        }
    }, [audioRef.current, currentTrack.trackUrl, currentTrack.isYoutube, setCurrentTrack]);

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
        if (!audioRef.current || !currentTrack.id || !currentTrack.isPlaying || currentTrack.isYoutube) return;

        const handleTimeUpdate = () => {
            const time = audioRef.current?.currentTime || 0;
            const dur = audioRef.current?.duration || 0;
            setCurrentTime(time);
            setDuration(dur);

            const trackId = currentTrack.id.toString();

            // When reaching 30 seconds and track not yet viewed
            if (time >= 30 && !viewedTracks.has(trackId)) {
                // Call API to increase view count
                axiosInstance.patch(`/api/v1/tracks/view/increase`, {
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
    // Sync AudioPlayer with global isPlaying state
    useEffect(() => {
        if (!playerRef.current?.audio?.current || currentTrack.isYoutube) return;

        if (currentTrack.isPlaying) {
            playerRef.current.audio.current.play().catch((e: any) => console.log('Footer play failed:', e));
        } else {
            playerRef.current.audio.current.pause();
        }
    }, [currentTrack.isPlaying, currentTrack.id, currentTrack.isYoutube]);

    if (!hasMounted) return (<></>)

    if (!currentTrack || !currentTrack.trackUrl) {
        return null;
    }


    return (
        <div style={{ marginTop: 50 }}>
            <Box
                position="fixed"
                bottom={isMobile ? 70 : 10}
                left={10}
                right={10}
                height={70}
                borderRadius="16px"
                sx={{
                    bgcolor: 'rgba(20,20,20,0.7)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    zIndex: 10000,
                    overflow: 'hidden',
                }}
            >
                <Container sx={{ display: "flex", gap: 3, alignItems: "center", py: 1, maxWidth: 'xl', px: 0 }}>

                    {/* Mobile: Simple Layout */}
                    {/* Always mounted AudioPlayer - Hidden on mobile, visible on desktop */}
                    <Box sx={{
                        display: isMobile ? 'none' : 'flex',
                        flexGrow: 1,
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
                        '& .rhap_volume-bar-area': { display: 'none' },
                        '& .rhap_repeat-button': { color: '#ccc', fontSize: '22px' },
                    }}>
                        {currentTrack.isYoutube ? (
                            <CustomYouTubePlayer 
                                onProgress={(time) => setCurrentTime(time)}
                                onDuration={(d) => setDuration(d)}
                            />
                        ) : (
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
                                onEnded={() => playNextTrack()}
                                onClickNext={() => playNextTrack()}
                                onClickPrevious={() => playPreviousTrack()}
                                listenInterval={500}
                                onListen={(e) => {
                                    if (audioRef.current) {
                                        setCurrentTime(audioRef.current.currentTime);
                                    }
                                }}
                                // onProgress={(e) => {
                                //     if (audioRef.current) {
                                //         setCurrentTime(audioRef.current.currentTime);
                                //     }
                                // }}
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
                        )}
                    </Box>

                    {/* YouTube Engine for Mobile (Invisible) */}
                    {isMobile && currentTrack.isYoutube && (
                        <Box sx={{ 
                            position: 'absolute', 
                            opacity: 0, 
                            pointerEvents: 'none', 
                            width: 1, 
                            height: 1, 
                            overflow: 'hidden' 
                        }}>
                            <CustomYouTubePlayer 
                                minimal={true}
                                onProgress={(time) => setCurrentTime(time)}
                                onDuration={(d) => setDuration(d)}
                            />
                        </Box>
                    )}

                    {isMobile ? (
                        <>
                            {/* Avatar */}
                            <Box sx={{ flexShrink: 0 }}>
                                <Image
                                    src={currentTrack.imgUrl || '/default-avatar.png'}
                                    alt={currentTrack.title}
                                    width={50}
                                    height={50}
                                    style={{
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowMobileDrawer(true)}
                                    unoptimized={true}
                                />
                            </Box>

                            {/* Track Info */}
                            <Box sx={{ flexGrow: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setShowMobileDrawer(true)}>
                                <Typography
                                    noWrap
                                    sx={{
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        mb: 0.5
                                    }}
                                >
                                    {currentTrack.title}
                                </Typography>
                                <Typography
                                    noWrap
                                    sx={{
                                        color: '#aaa',
                                        fontSize: '12px'
                                    }}
                                >
                                    {currentTrack.uploader?.name}
                                </Typography>
                            </Box>

                            {/* Play/Pause Button */}
                            <IconButton
                                onClick={() => {
                                    if (currentTrack.isPlaying) {
                                        setCurrentTrack({ ...currentTrack, isPlaying: false });
                                        if (audioRef.current) {
                                            audioRef.current.pause();
                                        }
                                    } else {
                                        setCurrentTrack({ ...currentTrack, isPlaying: true });
                                        if (audioRef.current) {
                                            audioRef.current.play().catch(err => console.log('Play failed:', err));
                                        }
                                    }
                                }}
                                sx={{
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                                }}
                            >
                                {currentTrack.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>

                            {/* SVG Border Progress (runs around the container) */}
                            <svg
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                }}
                            >
                                {/* Static background border (optional, replaces standard CSS border) */}
                                <rect
                                    width="100%"
                                    height="100%"
                                    rx="16"
                                    ry="16"
                                    fill="none"
                                    stroke="#333"
                                    strokeWidth="2"
                                />
                                {/* Dynamic progress border */}
                                <rect
                                    width="100%"
                                    height="100%"
                                    rx="16"
                                    ry="16"
                                    fill="none"
                                    stroke="#f50"
                                    strokeWidth="4" // 4px stroke, but 2px will be clipped by parent's overflow:hidden
                                    pathLength="100"
                                    strokeDasharray="100"
                                    strokeDashoffset={100 - (duration ? (currentTime / duration) * 100 : 0)}
                                    style={{
                                        transition: 'stroke-dashoffset 0.1s linear'
                                    }}
                                />
                            </svg>
                        </>
                        ) : (
                            /* Desktop: Track Info (Right Side) */
                            <Box sx={{ display: "flex", alignItems: "center", minWidth: 280, maxWidth: 300 }}>
                                <Box sx={{ width: 40, height: 40, mr: 1.5, flexShrink: 0, backgroundColor: '#444' }}>
                                    {!currentTrack.isYoutube ? (
                                        <Link href={generateTrackUrlUp(Number(currentTrack.id), currentTrack.title)} style={{ textDecoration: 'none' }}>
                                            {currentTrack.imgUrl && (
                                                <Image
                                                    src={`${currentTrack.imgUrl}`}
                                                    alt={currentTrack.title}
                                                    width={40}
                                                    height={40}
                                                    style={{
                                                        objectFit: 'cover',
                                                        borderRadius: '4px'
                                                    }}
                                                    unoptimized={true}
                                                />
                                            )}
                                        </Link>
                                    ) : (
                                        <Image
                                            src={`${currentTrack.imgUrl}`}
                                            alt={currentTrack.title}
                                            width={40}
                                            height={40}
                                            style={{
                                                objectFit: 'cover',
                                                borderRadius: '4px'
                                            }}
                                            unoptimized={true}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: 'hidden' }}>
                                    {!currentTrack.isYoutube ? (
                                        <Link href={generateProfileUrl(currentTrack.uploader.name, currentTrack.uploader.id)} style={{ textDecoration: 'none' }}>
                                            <Typography
                                                noWrap
                                                sx={{
                                                    color: "#aaa",
                                                    fontSize: 11,
                                                    mb: 0.2,
                                                    '&:hover': {
                                                        color: "white",
                                                        fontWeight: 'bold'
                                                    }
                                                }}
                                            >
                                                {currentTrack.uploader?.name || "Unknown"}
                                            </Typography>
                                        </Link>
                                    ) : (
                                        <Typography
                                            noWrap
                                            sx={{
                                                color: "#aaa",
                                                fontSize: 11,
                                                mb: 0.2
                                            }}
                                        >
                                            {currentTrack.uploader?.name || "YouTube"}
                                        </Typography>
                                    )}

                                    {!currentTrack.isYoutube ? (
                                        <Link href={generateTrackUrlUp(Number(currentTrack.id), currentTrack.title)} style={{ textDecoration: 'none' }}>
                                            <Typography
                                                noWrap
                                                sx={{
                                                    color: "white",
                                                    fontSize: 13,
                                                    fontWeight: 'bold',
                                                    transition: "color 0.2s ease",
                                                    '&:hover': {
                                                        color: "#f50",
                                                    }
                                                }}
                                            >
                                                {currentTrack.title || "No Track Selected"}
                                            </Typography>
                                        </Link>
                                    ) : (
                                        <Typography
                                            noWrap
                                            sx={{
                                                color: "white",
                                                fontSize: 13,
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {currentTrack.title || "YouTube Track"}
                                        </Typography>
                                    )}
                                </Box>
                                {!currentTrack.isYoutube && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                if (session) {
                                                    handleLikeClick()

                                                }
                                                else router.push('/auth/signin');

                                            }}
                                            disabled={mutation.isPending}
                                            sx={{
                                                color: '#ccc',
                                                p: 0.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.2)',
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
                                            <PlaylistAddIcon
                                                onClick={() => {
                                                    if (session) {
                                                        setShowPlaylistModal(true);
                                                    } else {
                                                        router.push('/auth/signin');
                                                    }
                                                }}
                                                fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        )}
                    <AddToPlaylistModal
                        open={showPlaylistModal}
                        onClose={() => setShowPlaylistModal(false)}
                        trackId={Number(currentTrack.id)}
                        imgUrl={currentTrack.imgUrl}
                        title={currentTrack.title}
                        uploader={currentTrack.uploader.name}
                        trackUrl={trackUrlCut}
                        uploaderId={currentTrack.uploader.id}
                    />
                </Container>
            </Box>

            {/* Mobile Full-Screen Drawer */}
            <Drawer
                anchor="bottom"
                open={showMobileDrawer}
                onClose={() => setShowMobileDrawer(false)}
                PaperProps={{
                    sx: {
                        height: '100%',
                        bgcolor: '#121212',
                    }
                }}
            >
                <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: '#fff' }}>
                            Now Playing
                        </Typography>
                        <IconButton onClick={() => setShowMobileDrawer(false)} sx={{ color: '#fff' }}>
                            ×
                        </IconButton>
                    </Box>

                    {/* Track Artwork */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Image
                            src={currentTrack.imgUrl || '/default-avatar.png'}
                            alt={currentTrack.title}
                            width={200}
                            height={200}
                            style={{
                                objectFit: 'cover',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                            }}
                            unoptimized={true}
                        />
                    </Box>

                    {/* Track Info */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>
                            {currentTrack.title}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#aaa' }}>
                            {currentTrack.uploader?.name}
                        </Typography>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ height: 4, bgcolor: '#333', borderRadius: 2, position: 'relative' }}>
                            <Box sx={{
                                height: '100%',
                                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                                bgcolor: '#f50',
                                borderRadius: 2
                            }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography sx={{ color: '#666', fontSize: '12px' }}>{formatTime(currentTime)}</Typography>
                            <Typography sx={{ color: '#666', fontSize: '12px' }}>{formatTime(duration)}</Typography>
                        </Box>
                    </Box>

                    {/* Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, mb: 3 }}>
                        <IconButton sx={{ color: '#fff' }}>
                            <SkipPreviousIcon fontSize="large" />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                if (currentTrack.isPlaying) {
                                    setCurrentTrack({ ...currentTrack, isPlaying: false });
                                    if (audioRef.current) {
                                        audioRef.current.pause();
                                    }
                                } else {
                                    setCurrentTrack({ ...currentTrack, isPlaying: true });
                                    if (audioRef.current) {
                                        audioRef.current.play().catch(err => console.log('Drawer play failed:', err));
                                    }
                                }
                            }}
                            sx={{
                                color: '#fff',
                                bgcolor: '#f50',
                                width: 56,
                                height: 56,
                                '&:hover': { bgcolor: '#e64000' }
                            }}
                        >
                            {currentTrack.isPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
                        </IconButton>
                        <IconButton sx={{ color: '#fff' }}>
                            <SkipNextIcon fontSize="large" />
                        </IconButton>
                    </Box>

                    {/* Additional Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 'auto' }}>
                        {!currentTrack.isYoutube && (
                            <>
                                <IconButton sx={{ color: '#ccc' }}>
                                    <FavoriteIcon />
                                </IconButton>
                                <IconButton sx={{ color: '#ccc' }}>
                                    <PlaylistAddIcon />
                                </IconButton>
                            </>
                        )}
                        <IconButton sx={{ color: '#ccc' }}>
                            <ShuffleIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Drawer>

        </div>
    )
}

export default React.memo(AppFooter);