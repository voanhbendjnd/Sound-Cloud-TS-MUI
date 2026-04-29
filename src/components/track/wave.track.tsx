'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { useWaveSurfer } from "@/utils/customHook";
import { useTrackContext } from "@/lib/track.wrapper";
import { WaveSurferOptions } from 'wavesurfer.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Avatar, Tooltip, TextField, Button, Box, Modal, Typography } from "@mui/material";
import './wave.scss';
import { useFetchComments, commentKeys, useFetchCommentsAxios } from "@/hooks/use.comment";
import LikeTrack from "@/components/track/like.track";
import axiosInstance from "@/utils/axios-instance";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import PauseIcon from "@mui/icons-material/Pause";

interface IProps {
    comments: IComment[];
    isLiked?: boolean;
}

const WaveTrack = (props: IProps) => {
    const searchParams = useSearchParams()
    const { comments, isLiked } = props;
    const router = useRouter();
    const fileName = searchParams.get('audio');
    const trackId = searchParams.get('id');
    const autoPlay = searchParams.get('autoPlay') === 'true';
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverRef = useRef<HTMLDivElement>(null);

    const [time, setTime] = useState<string>("0:00");
    const [duration, setDuration] = useState<string>("0:00");
    const [backgroundColor, setBackgroundColor] = useState<string>("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
    const [trackData, setTrackData] = useState<ITrack | null>(null);
    const [commentPreview, setCommentPreview] = useState<{
        show: boolean;
        position: number;
        time: number;
        userAvatar?: string;
        userName?: string;
    }>({ show: false, position: 0, time: 0 });
    const baseAudio = "https://res.cloudinary.com/dddppjhly/video/upload/";
    const fullAudioUrl = fileName ? `${baseAudio}${fileName}` : null;
    const [commentInput, setCommentInput] = useState({
        open: false,
        content: '',
        selectedTime: 0
    });
    const { data: session } = useSession();
    const [activeCommentId, setActiveCommentId] = useState<string | number | null>(null);
    const [hoveredCommentId, setHoveredCommentId] = useState<string | number | null>(null);
    const [isWaveformPlaying, setIsWaveformPlaying] = useState(false);
    const [waveDuration, setWaveDuration] = useState(0); // Stable duration state for comment positioning

    const { currentTrack, setCurrentTrack, audioRef, savedTimes } = useTrackContext() as ITrackContext;
    const isMatched = currentTrack.trackUrl === fullAudioUrl;
    const queryClient = useQueryClient();
    const { data: resComments } = useFetchCommentsAxios({
        current: 1,
        pageSize: 100,
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    });

    // Single source of truth for comments displayed on waveform
    const displayComments = useMemo(() => {
        return resComments?.data?.result ?? comments;
    }, [resComments?.data?.result, comments]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.round(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }

    const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
        let gradient, progressGradient;
        if (typeof window !== "undefined") {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            // Define the waveform gradient
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35);
            gradient.addColorStop(0, '#656666') // Top color
            gradient.addColorStop((canvas.height * 0.7) / canvas.height, '#656666') // Top color
            // gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
            // gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
            // gradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#B1B1B1') // Bottom color
            gradient.addColorStop(1, '#B1B1B1') // Bottom color

            // Define the progress gradient
            progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
            progressGradient.addColorStop(0, '#EE772F') // Top color
            progressGradient.addColorStop((canvas.height * 0.7) / canvas.height, '#EB4926') // Top color
            // progressGradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
            // progressGradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
            // progressGradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#F6B094') // Bottom color
            progressGradient.addColorStop(1, '#F6B094') // Bottom color
        }

        // Use pre-computed peaks if available, otherwise load audio file
        const options: Omit<WaveSurferOptions, 'container'> = {
            waveColor: gradient,
            progressColor: progressGradient,
            height: 200,

            barWidth: 2.3,
            barGap: 1.5,
            normalize: true,
            url: fullAudioUrl!,
        };

        // Add peaks if available from track data
        if (trackData?.peaks) {
            try {
                const rawPeaks = JSON.parse(trackData.peaks);
                const peaksArray = Array.isArray(rawPeaks) ? rawPeaks : rawPeaks.data;

                options.peaks = [peaksArray];

            } catch (e) {
                console.warn('Failed to parse peaks data', e);
            }
        }
        return options;
    }, [fullAudioUrl, trackData?.peaks]);

    const wavesurfer = useWaveSurfer(containerRef, optionsMemo);

    // Calculate stacking positions for avatars to avoid overlap
    // Uses stable waveDuration state instead of wavesurfer?.getDuration() which can be 0 during recalculation
    const avatarPositions = useMemo(() => {
        if (waveDuration === 0 || displayComments.length === 0) return {};

        // Sắp xếp comment theo thời gian phát
        const sortedComments = [...displayComments].sort((a, b) => a.moment - b.moment);
        const positions: { [key: string]: { top: number; left?: number; zIndex: number } } = {};

        // Khoảng cách tối thiểu để coi là "trùng nhau" (tính theo %)
        const minDistance = 4; // Tăng từ 3 lên 4

        // Pattern cho từng tier để phân bố avatar đều nhau
        const tierPattern = [
            { top: 142, left: 0 },          // Tier 0: center (just below split line)
            { top: 142, left: -4 },        // Tier 1: bottom-left
            { top: 142, left: 4 },         // Tier 2: bottom-right
            { top: 142, left: 0 },          // Tier 3: top (just above split line)
        ];

        sortedComments.forEach((comment, index) => {
            const leftPercent = (comment.moment / waveDuration) * 100;
            let tier = 0;
            let zIndex = 20;

            // Check overlap với tất cả comment đã xếp (không chỉ phía trước liền kề)
            let overlapCount = 0;
            for (let i = 0; i < index; i++) {
                const prevLeft = (sortedComments[i].moment / waveDuration) * 100;
                if (Math.abs(leftPercent - prevLeft) < minDistance) {
                    overlapCount++;
                }
            }

            // Giới hạn tối đa 4 tier
            tier = Math.min(overlapCount, 3);
            zIndex = 20 + tier;

            positions[comment.id] = {
                top: tierPattern[tier].top,
                left: tierPattern[tier].left,
                zIndex
            };
        });

        return positions;
    }, [waveDuration, displayComments]);

    // Sync play/pause from global state
    useEffect(() => {
        if (!wavesurfer) return;
        wavesurfer.setVolume(0);

        const hover = hoverRef.current!;
        const waveform = containerRef.current!;

        const handlePointerMove = (e: PointerEvent) => {
            if (hover) {
                hover.style.width = `${e.offsetX}px`;
            }
        };

        waveform.addEventListener('pointermove', handlePointerMove);

        // Handle waveform click for comment positioning
        const handleWaveformMouseDown = (e: MouseEvent) => {
            // Only show comment preview on right-click or with modifier key to avoid conflict with seeking
            if (e.button === 2 || e.ctrlKey || e.shiftKey) { // Right click or Ctrl/Shift + click
                e.preventDefault();
                e.stopPropagation();

                if (!wavesurfer || !containerRef.current) return;

                const rect = containerRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickPercent = clickX / rect.width;
                const clickTime = clickPercent * (wavesurfer.getDuration() || 0);

                console.log('Waveform clicked for comment:', { clickX, clickPercent, clickTime });

                // Get current user info
                const currentUser = {
                    name: "Current User",
                    avatar: "default-avatar"
                };

                setCommentPreview({
                    show: true,
                    position: clickPercent * 100,
                    time: clickTime,
                    userName: currentUser.name,
                    userAvatar: currentUser.avatar
                });
            }
        };

        waveform.addEventListener('mousedown', handleWaveformMouseDown);

        // Also add double-click for comment
        const handleWaveformDoubleClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (!wavesurfer || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickPercent = clickX / rect.width;
            const clickTime = clickPercent * (wavesurfer.getDuration() || 0);


            const currentUser = {
                name: "Current User",
                avatar: "default-avatar"
            };

            setCommentPreview({
                show: true,
                position: clickPercent * 100,
                time: clickTime,
                userName: currentUser.name,
                userAvatar: currentUser.avatar
            });
        };

        waveform.addEventListener('dblclick', handleWaveformDoubleClick);

        const subscriptions = [
            wavesurfer.on('decode', (d) => {
                setDuration(formatTime(d));
                setWaveDuration(d); // Store stable numeric duration for comment positioning
            }),
            wavesurfer.on('interaction', (newTime) => {
                if (isMatched && audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    savedTimes.current[fullAudioUrl || ''] = newTime;
                    // Only auto-play on seek if already playing, don't start playback on seek
                    if (currentTrack.isPlaying) {
                        audioRef.current.play();
                        setIsWaveformPlaying(true);
                    }
                }
            }),
            wavesurfer.on('play', () => setIsWaveformPlaying(true)),
            wavesurfer.on('pause', () => setIsWaveformPlaying(false))
        ];

        return () => {
            waveform.removeEventListener('pointermove', handlePointerMove);
            waveform.removeEventListener('mousedown', handleWaveformMouseDown);
            waveform.removeEventListener('dblclick', handleWaveformDoubleClick);
            subscriptions.forEach((unsub) => unsub());
        };
    }, [wavesurfer, isMatched, audioRef, fileName, savedTimes, currentTrack.isPlaying]);

    // Pause this wavesurfer when another track is playing
    useEffect(() => {
        if (!wavesurfer) return;

        // If another track is playing and this is not the current track, pause this wavesurfer
        if (currentTrack.trackUrl && currentTrack.isPlaying && !isMatched) {
            wavesurfer.pause();
            setIsWaveformPlaying(false);
        }

        // If this track becomes the current one, sync and potentially play
        if (isMatched && currentTrack.isPlaying) {
            const syncWavesurfer = () => {
                if (audioRef.current) {
                    const diff = Math.abs(wavesurfer.getCurrentTime() - audioRef.current.currentTime);
                    if (diff > 0.1) wavesurfer.setTime(audioRef.current.currentTime);
                    setTime(formatTime(audioRef.current.currentTime));

                    // Play wavesurfer if it's not playing and audio is playing
                    if (!wavesurfer.isPlaying() && audioRef.current.currentTime > 0) {
                        wavesurfer.play();
                        setIsWaveformPlaying(true);
                    }

                    // Update state based on actual wavesurfer state
                    setIsWaveformPlaying(wavesurfer.isPlaying());
                }
            };

            // Highlight active comment based on current time
            const handleTimeUpdate = () => {
                if (!audioRef.current || !isMatched) return;
                const currentTime = Math.round(audioRef.current.currentTime);

                // Find comment with moment matching current time
                const found = displayComments.find(c => Math.round(c.moment) === currentTime);

                if (found) {
                    setActiveCommentId(found.id);
                    // Clear highlight after 3 seconds
                    setTimeout(() => {
                        setActiveCommentId(null);
                    }, 3000);
                }
            };

            const audioEl = audioRef.current;
            if (audioEl) {
                audioEl.addEventListener('timeupdate', syncWavesurfer);
                audioEl.addEventListener('seeked', syncWavesurfer);
                audioEl.addEventListener('timeupdate', handleTimeUpdate);

                // Initial sync and play
                syncWavesurfer();
                if (!wavesurfer.isPlaying() && audioEl.currentTime > 0) {
                    wavesurfer.play();
                    setIsWaveformPlaying(true);
                }

                return () => {
                    audioEl.removeEventListener('timeupdate', syncWavesurfer);
                    audioEl.removeEventListener('seeked', syncWavesurfer);
                    audioEl.removeEventListener('timeupdate', handleTimeUpdate);
                };
            }
            return () => { };
        }

    }, [currentTrack.trackUrl, currentTrack.isPlaying, isMatched, wavesurfer, audioRef, displayComments]);

    const onPlayClick = useCallback(() => {
        if (isMatched && currentTrack.trackUrl) {
            // Toggle existing track
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({ ...currentTrack, isPlaying: willPlay } as any);
            if (willPlay && audioRef.current) {
                audioRef.current.play();
                // Also play wavesurfer
                if (wavesurfer && !wavesurfer.isPlaying()) {
                    wavesurfer.play();
                    setIsWaveformPlaying(true);
                }
            } else if (!willPlay && audioRef.current) {
                audioRef.current.pause();
                savedTimes.current[fullAudioUrl || ''] = audioRef.current.currentTime;
                // Also pause wavesurfer
                if (wavesurfer && wavesurfer.isPlaying()) {
                    wavesurfer.pause();
                    setIsWaveformPlaying(false);
                }
            }
        } else {
            // Save old track's time if exists
            if (currentTrack.trackUrl && audioRef.current) {
                savedTimes.current[currentTrack.trackUrl] = audioRef.current.currentTime;
            }

            // Create new track object using fetched trackData (preferred) or context fallback
            const source = trackData || currentTrack;
            const newTrack = {
                id: trackData?.id || fileName || `track-${Date.now()}`,
                trackUrl: fullAudioUrl,
                title: source.title || "Unknown Track",
                uploader: source.uploader || { name: "Unknown Artist" },
                imgUrl: source.imgUrl || "",
                description: source.description || "",
                isPlaying: true,
                isLiked: isLiked || source.isLiked || false
            };

            // Set current track first to ensure footer appears
            setCurrentTrack(newTrack as any);

            // Play immediately using wavesurfer
            if (wavesurfer) {
                const savedTime = savedTimes.current[fullAudioUrl || ''] || 0;
                wavesurfer.setTime(savedTime);
                wavesurfer.play();
                setIsWaveformPlaying(true);
            }

            // Also setup footer audio when ready
            setTimeout(() => {
                if (audioRef.current) {
                    const savedTime = savedTimes.current[fullAudioUrl || ''] || 0;
                    audioRef.current.currentTime = savedTime;
                    audioRef.current.play().catch(e => console.log('Audio play failed:', e));
                }
            }, 100);
        }
    }, [isMatched, currentTrack, fileName, setCurrentTrack, audioRef, savedTimes, wavesurfer, trackData]);

    // Extract color from track image using Canvas API
    useEffect(() => {
        const extractColor = () => {
            if (trackData?.imgUrl && typeof window !== "undefined") {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;

                    // Set canvas size to smaller for performance
                    const sampleSize = 100;
                    canvas.width = sampleSize;
                    canvas.height = sampleSize;

                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

                    // Get image data from center area
                    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                    const data = imageData.data;

                    let r = 0, g = 0, b = 0;
                    let pixelCount = 0;

                    // Sample pixels from center area
                    for (let i = 0; i < data.length; i += 4) {
                        // Skip very light or very dark pixels
                        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        if (brightness > 30 && brightness < 225) {
                            r += data[i];
                            g += data[i + 1];
                            b += data[i + 2];
                            pixelCount++;
                        }
                    }

                    if (pixelCount > 0) {
                        // Calculate average color
                        r = Math.floor(r / pixelCount);
                        g = Math.floor(g / pixelCount);
                        b = Math.floor(b / pixelCount);

                        // Create gradient with overlay for better readability
                        const dominantColor = `rgb(${r}, ${g}, ${b})`;
                        const gradient = `linear-gradient(135deg, ${dominantColor} 0%, rgba(0, 0, 0, 0.8) 100%)`;
                        setBackgroundColor(gradient);
                    } else {
                        // Fallback to default gradient
                        setBackgroundColor("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
                    }
                };

                img.onerror = () => {
                    console.error('Error loading image for color extraction');
                    // Fallback to default gradient
                    setBackgroundColor("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
                };

                img.src = `${trackData.imgUrl}`;
            }
        };

        extractColor();
    }, [trackData?.imgUrl]);

    // Fetch track data and handle autoPlay
    useEffect(() => {
        const fetchTrackData = async () => {
            if (trackId && fileName) {
                try {
                    const res = await axios.get<IBackendRes<ITrack>>(
                        `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${trackId}`,
                        // {
                            // headers: {
                                // Authorization: `Bearer ${session?.access_token}`,
                            // }
                        // }
                    );
                    if (res && res.data) {
                        const track = res.data.data;
                        // @ts-ignore
                        setTrackData(track);
                        setIsWaveformPlaying(false);

                    }
                } catch (error) {
                    router.push("/");
                }
            }
        };
        fetchTrackData();
    }, [trackId, fileName]);

    // Sync isWaveformPlaying with actual wavesurfer state
    useEffect(() => {
        if (wavesurfer) {
            setIsWaveformPlaying(wavesurfer.isPlaying());
        }
    }, [wavesurfer, fileName]);
    const totalDuration = waveDuration;

    const calculateLeft = useCallback((moment: number) => {
        if (totalDuration === 0) return "0%";
        const percent = (moment / totalDuration) * 100;
        return `${percent}%`;
    }, [totalDuration]);

    // Handle comment preview click
    const handleCommentPreviewClick = () => {
        setCommentInput({
            open: true,
            content: '',
            selectedTime: commentPreview.time
        });
    };

    // Clear comment preview
    const clearCommentPreview = () => {
        setCommentPreview({ show: false, position: 0, time: 0 });
        setCommentInput({ open: false, content: '', selectedTime: 0 });
    };

    // Handle comment submission
    const handleSubmitComment = async () => {
        if (!commentInput.content.trim()) return;

        try {
            // Submit comment to API
            const response = await fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: commentInput.content,
                    moment: commentInput.selectedTime,
                    trackId: Number(trackId)
                })
            });

            if (response.ok) {
                // Optimistic update: add new comment to React Query cache immediately
                const newComment: IComment = {
                    id: Date.now(), // Temporary ID
                    content: commentInput.content,
                    moment: commentInput.selectedTime,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    user: {
                        name: "Current User",
                        avatar: ""
                    },
                    track: { id: Number(trackId), imgUrl: "", title: "" }
                } as IComment;

                const waveformQueryKey = commentKeys.list({
                    current: 1,
                    pageSize: 100,
                    trackId: Number(trackId),
                    sort: "updatedAt,desc"
                });

                // Update React Query cache for immediate display
                queryClient.setQueryData(waveformQueryKey, (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            result: [newComment, ...old.data.result]
                        }
                    };
                });

                // Invalidate to sync with server (will get real ID, user info, etc.)
                queryClient.invalidateQueries({ queryKey: waveformQueryKey });

                clearCommentPreview();
            } else {
                console.error('Failed to submit comment');
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };

    return (
        <div style={{ paddingTop: 20 }}>

            <div
                className="wave-background"
                style={{
                    background: backgroundColor,
                    position: 'relative'
                }}
            >
                {/* Overlay for better text readability */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 1
                    }}
                />
                <div className="left" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="info" style={{ display: "flex" }}>
                        <div>
                            <div className="wave-button"
                                onClick={() => onPlayClick()}>
                                {isWaveformPlaying ?
                                    <PauseIcon
                                        sx={{ fontSize: 30, color: "white" }}
                                    />
                                    :
                                    <PlayArrowIcon
                                        sx={{ fontSize: 30, color: "white" }}
                                    />
                                }
                            </div>
                        </div>
                        <div style={{ marginLeft: 20 }}>
                            <div style={{
                                padding: "0 5px",
                                background: "#333",
                                fontSize: 30,
                                width: "fit-content",
                                color: "white"
                            }}>
                                {trackData?.title || currentTrack.title}
                            </div>
                            <div style={{
                                padding: "0 5px",
                                marginTop: 10,
                                background: "#333",
                                fontSize: 20,
                                width: "fit-content",
                                color: "white"
                            }}
                            >
                                {trackData?.uploader?.name || currentTrack.uploader?.name}
                            </div>
                        </div>
                    </div>
                    <div ref={containerRef} className="wave-form-container">
                        <div className="time" >{time}</div>
                        <div className="duration" >{duration}</div>
                        <div ref={hoverRef} className="hover-wave"></div>
                        {/* Split line at 50% height */}
                        <div
                            style={{
                                position: "absolute",
                                top: "71%",
                                left: 0,
                                right: 0,
                                height: "1px",
                                background: "rgb(5 5 5 / 0.5)",
                                zIndex: 15,
                                pointerEvents: "none"
                            }}
                        ></div>
                        <div className="overlay"
                            style={{
                                position: "absolute",
                                height: "35%",
                                width: "100%",
                                bottom: "0",
                                background: "linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 70%, transparent 100%)",
                                zIndex: 15,
                                pointerEvents: "none"
                            }}
                        ></div>
                        <div className="comments" style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 20
                        }}>
                            {
                                displayComments.map(it => {
                                    const userAvatarSrc = it.user?.avatar
                                    it.user.type !== "SYSTEM" ? `${it.user.avatar}` : it.user.type === "SYSTEM"
                                        ? `${it.user.avatar}`
                                        : undefined;
                                    const isActive = activeCommentId === it.id;
                                    const isHovered = hoveredCommentId === it.id;
                                    const shouldShowTooltip = isActive || isHovered;
                                    const position = avatarPositions[it.id] || { top: 70, zIndex: 20 };
                                    const resCmt = it.user.name + ': ' + it.content;
                                    return (
                                        <Tooltip
                                            key={it.id}
                                            title={resCmt}
                                            open={shouldShowTooltip}
                                            arrow
                                            onMouseEnter={() => setHoveredCommentId(it.id)}
                                            onMouseLeave={() => setHoveredCommentId(null)}
                                        >
                                            <Avatar
                                                src={userAvatarSrc}
                                                onPointerMove={(e) => {
                                                    const hover = hoverRef.current!;
                                                    hover.style.width = calculateLeft(it.moment)
                                                }}
                                                style={{
                                                    left: calculateLeft(it.moment),
                                                    top: position.top,
                                                    width: isActive ? 24 : 20,
                                                    height: isActive ? 24 : 20,
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    transform: position.left ? `translateX(calc(-50% + ${position.left}px))` : 'translateX(-50%)',
                                                    border: isActive ? '2px solid #f50' : '1px solid #333',
                                                    pointerEvents: 'auto',
                                                    cursor: 'pointer',
                                                    zIndex: isActive ? 100 : position.zIndex,
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isActive ? '0 0 8px #f50' : 'none',
                                                }}
                                            >
                                                {it.user?.name?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </Tooltip>
                                    )
                                })
                            }

                            {/* Comment Preview Avatar */}
                            {commentPreview.show && (
                                <Tooltip title="Click to comment here" arrow>
                                    <Avatar
                                        className="avatar-preview"
                                        style={{
                                            left: `${commentPreview.position}%`,
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            border: '2px solid #ff5500',
                                            boxShadow: '0 0 10px rgba(255, 85, 0, 0.5)',
                                            transform: 'translateX(-50%)',
                                            zIndex: 10,
                                            cursor: 'pointer'
                                        }}
                                        onClick={handleCommentPreviewClick}
                                    >
                                        {commentPreview.userName?.charAt(0).toUpperCase()}
                                    </Avatar>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
                <div className="right"
                    style={{
                        width: "25%",
                        padding: 15,
                        display: "flex",
                        alignItems: "center",
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <div className="track-image-container" style={{
                        width: '250px',
                        height: '250px',
                        overflow: 'hidden',
                        borderRadius: '10px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#333'
                    }}>
                        <img
                            src={`${trackData?.imgUrl || currentTrack.imgUrl || '/image/earth.jpg'}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                display: 'block'
                            }}
                            alt="Track cover"
                        />
                    </div>
                </div>
            </div>
            {trackData && (
                <div style={{ marginTop: 15 }}>
                    <LikeTrack
                        trackId={Number(trackId)}
                        initialLikes={trackData.countLike}
                        initialIsLiked={isLiked || trackData.isLiked}
                        initialCountPlays={trackData.countPlay}
                    />
                </div>
            )}
            {/* Comment Input Modal */}
            <Modal
                open={commentInput.open}
                onClose={clearCommentPreview}
                aria-labelledby="comment-modal-title"
                aria-describedby="comment-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: '#282828',
                    border: '1px solid #333',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4,
                    minWidth: 400,
                    color: 'white'
                }}>
                    <Typography id="comment-modal-title" variant="h6" sx={{ mb: 2, color: 'white' }}>
                        Comment at {formatTime(commentInput.selectedTime)}
                    </Typography>
                    <TextField
                        id="comment-modal-description"
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        placeholder="Write your comment..."
                        value={commentInput.content}
                        onChange={(e) => setCommentInput(prev => ({ ...prev, content: e.target.value }))}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#555',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#777',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#ff5500',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: 'white',
                            },
                            '& .MuiInputLabel-root': {
                                color: '#999',
                            },
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            onClick={clearCommentPreview}
                            sx={{
                                color: '#999',
                                borderColor: '#555',
                                '&:hover': {
                                    borderColor: '#777',
                                    bgcolor: 'rgba(255,255,255,0.05)'
                                }
                            }}
                            variant="outlined"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitComment}
                            disabled={!commentInput.content.trim()}
                            sx={{
                                bgcolor: '#ff5500',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: '#e04800',
                                },
                                '&:disabled': {
                                    bgcolor: '#555',
                                    color: '#999'
                                }
                            }}
                            variant="contained"
                        >
                            Post Comment
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div >
    )
}

export default WaveTrack;