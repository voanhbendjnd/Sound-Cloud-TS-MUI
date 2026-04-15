'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useWaveSurfer } from "@/utils/customHook";
import { WaveSurferOptions } from 'wavesurfer.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RepeatIcon from '@mui/icons-material/Repeat';
import IosShareIcon from '@mui/icons-material/IosShare';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {useTrackContext} from "@/lib/track.wrapper";

dayjs.extend(relativeTime);

export interface ProfileTrackProps {
    track: ITrack;
}

const ProfileTrack = ({ track }: ProfileTrackProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverRef = useRef<HTMLDivElement>(null);
    const { currentTrack, setCurrentTrack, audioRef, savedTimes } = useTrackContext() as ITrackContext;
    const [time, setTime] = useState<string>("0:00");
    const [duration, setDuration] = useState<string>("0:00");
    const isMatched = currentTrack.id === track.id;

    const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
        let gradient;
        if (typeof window !== "undefined") {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            gradient = ctx.createLinearGradient(0, 0, 0, 150);
            gradient.addColorStop(0, '#ccc');
            gradient.addColorStop(1, '#666');
        }

        return {
            waveColor: gradient || '#999',
            progressColor: '#f50',
            height: 100,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            url: `/api?audio=${track.trackUrl}`,
        }
    }, [track.trackUrl]);

    const wavesurfer = useWaveSurfer(containerRef, optionsMemo);

    useEffect(() => {
        if (!wavesurfer) return;
        wavesurfer.setVolume(0);

        const hover = hoverRef.current!;
        const waveform = containerRef.current!;
        const handlePointerMove = (e: PointerEvent) => (hover.style.width = `${e.offsetX}px`);
        waveform.addEventListener('pointermove', handlePointerMove);

        const subscriptions = [
            wavesurfer.on('decode', (duration) => {
                setDuration(formatTime(duration));
            }),
            wavesurfer.on('interaction', (newTime) => {
                if (isMatched && audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    savedTimes.current[track.id] = newTime;
                    audioRef.current.play();
                }
            }),
        ];

        return () => {
            waveform.removeEventListener('pointermove', handlePointerMove);
            subscriptions.forEach((unsub) => unsub());
        };
    }, [wavesurfer, isMatched, audioRef, track.id, savedTimes]);

    // Visually sync wavesurfer with global audio play progress
    useEffect(() => {
        if (!wavesurfer || !isMatched || !audioRef.current) return;
        
        const syncWavesurfer = () => {
            if (audioRef.current) {
                const diff = Math.abs(wavesurfer.getCurrentTime() - audioRef.current.currentTime);
                if (diff > 0.1) wavesurfer.setTime(audioRef.current.currentTime);
                setTime(formatTime(audioRef.current.currentTime));
            }
        };

        const audioEl = audioRef.current;
        audioEl.addEventListener('timeupdate', syncWavesurfer);
        audioEl.addEventListener('seeked', syncWavesurfer);

        // Intial sync in case it's already ahead
        syncWavesurfer();

        return () => {
            audioEl.removeEventListener('timeupdate', syncWavesurfer);
            audioEl.removeEventListener('seeked', syncWavesurfer);
        };
    }, [wavesurfer, isMatched, audioRef]);

    const onPlayClick = useCallback(() => {
        if (isMatched) {
            // Toggle
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({ ...currentTrack, isPlaying: willPlay } as any);
            if (willPlay && audioRef.current) {
                audioRef.current.play();
            } else if (!willPlay && audioRef.current) {
                audioRef.current.pause();
                savedTimes.current[track.id] = audioRef.current.currentTime;
            }
        } else {
            // Save old track's time
            if (currentTrack.id && audioRef.current) {
                savedTimes.current[currentTrack.id] = audioRef.current.currentTime;
            }

            // Start new track
            setCurrentTrack({ ...track, isPlaying: true } as any);

            // Wait for audio ready to restore saved playback time
            if (audioRef.current) {
                const onLoadedData = () => {
                    const savedTime = savedTimes.current[track.id] || 0;
                    audioRef.current!.currentTime = savedTime;
                    wavesurfer?.setTime(savedTime);
                    audioRef.current!.play();
                    audioRef.current!.removeEventListener('loadeddata', onLoadedData);
                }
                audioRef.current.addEventListener('loadeddata', onLoadedData);
            }
        }
    }, [isMatched, currentTrack, track, setCurrentTrack, audioRef, savedTimes, wavesurfer]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    };

    return (
        <Box sx={{ display: 'flex', mb: 4, pt: 2, pb: 2, color: 'white', borderBottom: '1px solid #333' }}>
            {/* Left Image */}
            <Box sx={{ width: 160, height: 160, mr: 2, flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src={`http://localhost:8080/api/v1/files/img-tracks/${track.imgUrl}`} 
                    alt={track.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
            </Box>

            {/* Right Content */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Play Button */}
                        <Box
                            onClick={onPlayClick}
                            sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                background: '#f50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                mr: 2
                            }}
                        >
                            {currentTrack.isPlaying && isMatched ? <PauseIcon sx={{ color: 'white', fontSize: 32 }} /> : <PlayArrowIcon sx={{ color: 'white', fontSize: 32 }} />}
                        </Box>
                        {/* Info */}
                        <Box>
                            <Typography variant="body2" sx={{ color: '#ccc', mb: 0.5 }}>
                                {track.uploader.name}
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'white', lineHeight: 1 }}>
                                {track.title}
                            </Typography>
                        </Box>
                    </Box>
                    {/* Time Ago */}
                    <Box>
                        <Typography variant="body2" sx={{ color: '#999' }}>
                            {dayjs(track.createdAt).fromNow()}
                        </Typography>
                    </Box>
                </Box>

                {/* Waveform */}
                <Box sx={{ position: 'relative', flexGrow: 1, my: 1, display: 'flex', alignItems: 'flex-end', minHeight: 100 }}>
                    <Box ref={containerRef} sx={{ width: '100%' }}>
                        <Box ref={hoverRef} sx={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: 0, 
                            zIndex: 10, 
                            pointerEvents: 'none', 
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            height: '100%', 
                            borderRight: '1px solid white' 
                        }} />
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 5, right: 0, background: 'rgba(0,0,0,0.8)', px: 0.5, py: 0.2, fontSize: 12, color: '#ccc' }}>
                        {time} / {duration}
                    </Box>
                </Box>

                {/* Actions bottom */}
                <Box sx={{ display: 'flex', gap: 1, pt: 1, alignItems: 'center' }}>
                    <Button variant="outlined" size="small" startIcon={<FavoriteIcon fontSize="small"/>} sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#f50' } }}>
                        {track.countLike || 0}
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<RepeatIcon fontSize="small"/>} sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Repost
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<IosShareIcon fontSize="small"/>} sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Share
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<ContentCopyIcon fontSize="small"/>} sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Copy Link
                    </Button>
                    <Button variant="outlined" size="small" sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        <MoreHorizIcon fontSize="small" />
                    </Button>

                    <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center', color: '#999', fontSize: 13 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PlayArrowOutlinedIcon fontSize="small" />
                            {track.countPlay || 0}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ChatBubbleOutlineIcon fontSize="small" />
                            0
                        </Box>
                    </Box>
                </Box>

            </Box>
        </Box>
    )
}
export default ProfileTrack;
