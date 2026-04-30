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
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { Avatar, Tooltip, TextField, Button as MuiButton, Box, Modal, Typography, IconButton, Chip } from "@mui/material";
import Button from "@mui/material/Button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTrackContext } from "@/lib/track.wrapper";
import Link from "next/link";
import { useCreateComment, useFetchComments, useFetchCommentsAxios } from "@/hooks/use.comment";
import { useLikeTrackMutation } from "@/hooks/use-track";
import { useIsLiked } from "@/hooks/use-isliked";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import AddToPlaylistModal from "@/components/playlist/add-to-playlist-modal";
import axiosInstance from "@/utils/axios-instance";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);

export interface ProfileTrackProps {
    track: ITrack;
}

const ProfileTrack = ({ track }: ProfileTrackProps) => {
    const [wsReady, setWsReady] = useState(false);
    const [waveDuration, setWaveDuration] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverRef = useRef<HTMLDivElement>(null);
    const { currentTrack, setCurrentTrack, audioRef, savedTimes } = useTrackContext() as ITrackContext;
    const { data: session } = useSession();
    const router = useRouter();
    const [time, setTime] = useState<string>("0:00");
    const [duration, setDuration] = useState<string>("0:00");
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const baseAudio = "https://res.cloudinary.com/dddppjhly/video/upload/";
    const fullAudioUrl = track.trackUrl ? `${baseAudio}${track.trackUrl}` : null;
    const isMatched = currentTrack.trackUrl === fullAudioUrl;
    const [countLikes, setCountLikes] = useState<number>(track.countLike || 0);
    const mutation = useLikeTrackMutation();
    // Use separate isLiked API for logged-in users
    // const { data: isLiked } = useIsLiked(Number(track.id));
    const [isLove, setIsLove] = useState<boolean>(track.isLiked);
    // Sync isLiked with currentTrack when track ID matches
    useEffect(() => {
        if (isMatched && isLove !== undefined) {
            setCurrentTrack({
                ...currentTrack,
                isLiked: isLove
            });
        }
    }, [currentTrack.id, isLove, isMatched]);

    const handleLikeClick = () => {
        if (!session) {
            // Redirect to signin with callback URL
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
            return;
        }
        mutation.mutate(Number(track.id), {
            onSuccess: (res) => {
                if (res?.data) {
                    setCountLikes(res.data.countLikes);

                    setIsLove(res.data.isLiked);

                    // Update TrackContext if this is the current track
                    if (isMatched) {
                        setCurrentTrack({
                            ...currentTrack,
                            isLiked: res.data.isLiked
                        });
                    }
                }
            }
        });
    };

    // Comment states
    const [showComments, setShowComments] = useState<boolean>(false);
    const [activeCommentId, setActiveCommentId] = useState<string | number | null>(null);
    const [hoveredCommentId, setHoveredCommentId] = useState<string | number | null>(null);
    const [commentPreview, setCommentPreview] = useState<{
        show: boolean;
        position: number;
        time: number;
        userAvatar?: string;
        userName?: string;
    }>({ show: false, position: 0, time: 0 });

    const [commentInput, setCommentInput] = useState({
        open: false,
        content: '',
        selectedTime: 0
    });

    // Fetch comments for this track
    const { data: resComments } = useFetchCommentsAxios({
        current: 1,
        pageSize: 50,
        trackId: Number(track.id),
        sort: "updatedAt,desc"
    });
    const comments = resComments?.result ?? [];

    const formatTimeUtil = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.round(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    };

    // Comment handlers
    const handleWaveformMouseDown = (e: MouseEvent) => {
        if (!showComments) return; // Only allow comments when track is playing

        // Only show comment preview on right-click or with modifier key
        if (e.button === 2 || e.ctrlKey || e.shiftKey) {
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
        }
    };

    const handleWaveformDoubleClick = (e: MouseEvent) => {
        if (!showComments) return; // Only allow comments when track is playing

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

    const handleCommentPreviewClick = () => {
        setCommentInput({
            open: true,
            content: '',
            selectedTime: commentPreview.time
        });
    };

    const clearCommentPreview = () => {
        setCommentPreview({ show: false, position: 0, time: 0 });
        setCommentInput({ open: false, content: '', selectedTime: 0 });
    };


    // 1. Định nghĩa params cho comment (giống như lúc bạn fetch)
    const commentParams = {
        current: 1,
        pageSize: 50,
        trackId: Number(track.id),
        sort: "updatedAt,desc"
    };


    // 2. Khai báo mutation hook
    const createCommentMutation = useCreateComment(commentParams);
    const handleSubmitComment = async () => {
        if (!commentInput.content.trim()) return;

        // Ưu tiên thời gian chọn trên waveform (selectedTime), nếu không có mới dùng thời gian thực
        const momentToPost = commentInput.open
            ? Math.round(commentInput.selectedTime)
            : (audioRef.current ? Math.round(audioRef.current.currentTime) : 0);

        createCommentMutation.mutate({
            content: commentInput.content,
            moment: momentToPost,
            track_id: Number(track.id)
        }, {
            onSuccess: () => {
                clearCommentPreview();
                // Reset text sau khi post thành công
                setCommentInput(prev => ({ ...prev, content: '' }));
                toast.success("Post comment success!");
            },
            onError: (error: any) => {
                const msg = error?.response?.data?.message || "Please log in to continue!";
                toast.warning(msg);
            }
        });
    };
    const calculateLeft = useCallback((moment: number) => {
        if (waveDuration === 0) return "0%";
        const percent = (moment / waveDuration) * 100;
        return `${percent}%`;
    }, [waveDuration]);
    const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
        let gradient, progressGradient;

        if (typeof window !== "undefined") {
            const canvas = document.createElement('canvas');
            const dpr = window.devicePixelRatio || 1;
            canvas.height = 100 * dpr;
            const ctx = canvas.getContext('2d')!;

            // 🎵 WAVE (background)
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

            gradient.addColorStop(0, '#444');     // top (đậm)
            gradient.addColorStop(0.4, '#666');   // mid
            gradient.addColorStop(1, '#bbb');     // bottom (nhạt)

            // 🔥 PROGRESS (cam giống SoundCloud)
            progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

            progressGradient.addColorStop(0, '#ff5500');  // top đậm
            progressGradient.addColorStop(0.5, '#ff6a1a');// mid
            progressGradient.addColorStop(1, '#ffb199');  // bottom nhạt
        }

        const options: Omit<WaveSurferOptions, 'container'> = {
            waveColor: gradient || '#999',
            progressColor: progressGradient || '#ff5500',
            height: 100,
            barWidth: 2,
            barGap: 1,
            normalize: true,
            url: fullAudioUrl || '',
        };

        // peaks
        if (track?.peaks) {
            try {
                const rawPeaks = JSON.parse(track.peaks);
                const peaksArray = Array.isArray(rawPeaks) ? rawPeaks : rawPeaks.data;
                options.peaks = [peaksArray];
            } catch (e) {
                console.warn('Failed to parse peaks data', e);
            }
        }

        return options;
    }, [fullAudioUrl, track?.peaks]);


    // const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
    //     let gradient;
    //     if (typeof window !== "undefined") {
    //         const canvas = document.createElement('canvas');
    //         const ctx = canvas.getContext('2d')!;
    //         gradient = ctx.createLinearGradient(0, 0, 0, 150);
    //         gradient.addColorStop(0, '#ccc');
    //         gradient.addColorStop(1, '#666');
    //     }
    //
    //     return {
    //         waveColor: gradient || '#999',
    //         progressColor: '#f50',
    //         height: 60,
    //         barWidth: 1.8,
    //         barGap: 1,
    //         // barRadius: 2,
    //
    //         // barWidth: 2.3,
    //         // barGap: 1,
    //
    //         normalize: true,
    //         url: fullAudioUrl || '',
    //     }
    // }, [fullAudioUrl]);

    const wavesurfer = useWaveSurfer(containerRef, optionsMemo);

    // Calculate stacking positions for avatars to avoid overlap
    const avatarPositions = useMemo(() => {
        if (waveDuration === 0 || comments.length === 0) return {};

        // Sắp xếp comment theo thời gian phát
        const sortedComments = [...comments].sort((a, b) => a.moment - b.moment);
        const totalDuration = waveDuration;
        const positions: { [key: string]: { top: number; left?: number; zIndex: number } } = {};

        // Khoảng cách tối thiểu để coi là "trùng nhau" (tính theo %)
        const minDistance = 4; // Tăng từ 3 lên 4

        // Pattern cho từng tier để phân bố avatar đều nhau
        const tierPattern = [
            { top: 70, left: 0 },          // Tier 0: center bottom
            { top: 70, left: -4 },        // Tier 1: bottom-left
            { top: 70, left: 4 },         // Tier 2: bottom-right
            { top: 70, left: 0 },         // Tier 3: top
        ];

        sortedComments.forEach((comment, index) => {
            const leftPercent = (comment.moment / totalDuration) * 100;
            let tier = 0;
            let zIndex = 20;

            // Check overlap với tất cả comment đã xếp (không chỉ phía trước liền kề)
            let overlapCount = 0;
            for (let i = 0; i < index; i++) {
                const prevLeft = (sortedComments[i].moment / totalDuration) * 100;
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
    }, [waveDuration, comments]);
    useEffect(() => {
        if (!wavesurfer) return;
        wavesurfer.setVolume(0);

        const hover = hoverRef.current!;
        const waveform = containerRef.current!;
        const handlePointerMove = (e: PointerEvent) => (hover.style.width = `${e.offsetX}px`);
        waveform.addEventListener('pointermove', handlePointerMove);

        // Add waveform click listeners for comments
        waveform.addEventListener('mousedown', handleWaveformMouseDown);
        waveform.addEventListener('dblclick', handleWaveformDoubleClick);

        const subscriptions = [
            wavesurfer.on('decode', (duration) => {
                setDuration(formatTime(duration));
                setWaveDuration(duration);
                setWsReady(true);
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
            waveform.removeEventListener('mousedown', handleWaveformMouseDown);
            waveform.removeEventListener('dblclick', handleWaveformDoubleClick);
            subscriptions.forEach((unsub) => unsub());
        };
    }, [wavesurfer, isMatched, audioRef, track.id, savedTimes]);

    // TỐI ƯU 1: Logic hiển thị comment nên tách bạch và dọn dẹp triệt để
    useEffect(() => {
        // Nếu không còn khớp (isMatched false) hoặc nhạc dừng (isPlaying false)
        if (!isMatched || !currentTrack.isPlaying) {
            setShowComments(false);
            setCommentInput(prev => ({ ...prev, content: '', open: false }));
            setCommentPreview({ show: false, position: 0, time: 0 });
        } else {
            setShowComments(true);
        }
    }, [isMatched, currentTrack.isPlaying]);

    // Pause this wavesurfer when another track is playing
    useEffect(() => {
        if (!wavesurfer) return;

        // If another track is playing and this is not the current track, pause this wavesurfer
        if (currentTrack.trackUrl && currentTrack.isPlaying && !isMatched) {
            wavesurfer.pause();
        }

        // If this track becomes the current one, sync and potentially play
        if (isMatched && currentTrack.isPlaying) {
            const syncWavesurfer = () => {
                if (audioRef.current) {
                    const diff = Math.abs(wavesurfer.getCurrentTime() - audioRef.current.currentTime);
                    if (diff > 0.1) wavesurfer.setTime(audioRef.current.currentTime);
                    setTime(formatTime(audioRef.current.currentTime));
                }
            };

            // Highlight active comment based on current time
            const handleTimeUpdate = () => {
                if (!audioRef.current || !isMatched) return;
                const currentTime = Math.round(audioRef.current.currentTime);

                // Find comment with moment matching current time
                const found = comments.find(c => Math.round(c.moment) === currentTime);

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

                // Initial sync in case it's already ahead
                syncWavesurfer();

                return () => {
                    audioEl.removeEventListener('timeupdate', syncWavesurfer);
                    audioEl.removeEventListener('seeked', syncWavesurfer);
                    audioEl.removeEventListener('timeupdate', handleTimeUpdate);
                };
            }
            return () => { };
        }

        // If this track is paused and it's the current track, pause wavesurfer
        if (isMatched && !currentTrack.isPlaying) {
            wavesurfer.pause();
        }
    }, [currentTrack.trackUrl, currentTrack.isPlaying, isMatched, wavesurfer, audioRef, comments]);

    const onPlayClick = useCallback(() => {
        if (isMatched) {
            // Toggle
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({ ...currentTrack, isPlaying: willPlay } as any);
            if (willPlay && audioRef.current) {
                audioRef.current.play();
                // Also play wavesurfer
                if (wavesurfer) {
                    wavesurfer.play();
                }
            } else if (!willPlay && audioRef.current) {
                audioRef.current.pause();
                // Also pause wavesurfer
                if (wavesurfer) {
                    wavesurfer.pause();
                }
                savedTimes.current[track.id] = audioRef.current.currentTime;
            }
        } else {
            // Save old track's time if exists
            if (currentTrack.id && audioRef.current) {
                savedTimes.current[currentTrack.id] = audioRef.current.currentTime;
            }

            // Set current track first to ensure footer appears
            setCurrentTrack({ ...track, trackUrl: fullAudioUrl, isPlaying: true } as any);

            // Play immediately using wavesurfer (don't wait for footer)
            if (wavesurfer) {
                const savedTime = savedTimes.current[track.id] || 0;
                wavesurfer.setTime(savedTime);
                wavesurfer.play();
            }

            // Also setup footer audio when ready (async)
            setTimeout(() => {
                if (audioRef.current) {
                    const savedTime = savedTimes.current[track.id] || 0;
                    audioRef.current.currentTime = savedTime;
                    audioRef.current.play().catch(e => console.log('Footer audio play failed:', e));
                }
            }, 100);
        }
    }, [isMatched, currentTrack, track, setCurrentTrack, audioRef, savedTimes, wavesurfer]);
    return (
        <Box sx={{ display: 'flex', mb: 4, pt: 2, pb: 2, color: 'white', borderBottom: '1px solid #333' }}>
            {/* Left Image */}
            <Box sx={{ width: 160, height: 160, mr: 2, flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={`${track.imgUrl}`}
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
                            <Link style={{ textDecoration: "none" }} href={`/track/${track.id}?audio=${track.trackUrl}&id=${track.id}`}>
                                <Typography variant="h6" sx={{ color: 'white', lineHeight: 1 }}>
                                    {track.title}
                                </Typography>
                            </Link>

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
                <Box sx={{ position: 'relative', flexGrow: 1, my: 1, display: 'flex', alignItems: 'flex-end', minHeight: 60 }}>
                    <Box ref={containerRef} sx={{ width: '100%', position: 'relative' }}>
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
                        <div
                            style={{
                                position: "absolute",
                                top: "71%",
                                left: 0,
                                right: 0,
                                height: "0.5px",
                                background: "#464646",
                                zIndex: 15,
                                pointerEvents: "none"
                            }}
                        ></div>
                        {/* Dark overlay under avatars for better visibility */}
                        <Box sx={{
                            position: 'absolute',
                            height: '35%',
                            width: '100%',
                            bottom: 0,
                            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 70%, transparent 100%)',
                            zIndex: 15,
                            pointerEvents: 'none'
                        }} />

                        {/* Comment avatars on waveform - Always visible */}
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 20
                        }}>
                            {comments.map(comment => {
                                const userAvatarSrc = comment.user?.avatar;
                                const isActive = activeCommentId === comment.id;
                                const isHovered = hoveredCommentId === comment.id;
                                const position = avatarPositions[comment.id] || { top: 70, zIndex: 20 };
                                const shouldShowTooltip = isActive || isHovered;
                                const resContent = comment.user.name + ': ' + comment.content;
                                return (
                                    <Tooltip
                                        key={comment.id}
                                        title={resContent}
                                        open={shouldShowTooltip}
                                        arrow
                                        onMouseEnter={() => setHoveredCommentId(comment.id)}
                                        onMouseLeave={() => setHoveredCommentId(null)}
                                    >
                                        <Avatar
                                            src={userAvatarSrc}
                                            sx={{
                                                position: 'absolute',
                                                left: calculateLeft(comment.moment),
                                                top: position.top,
                                                width: isActive ? 16 : 12,
                                                height: isActive ? 16 : 12,
                                                transform: position.left ? `translateX(calc(-50% + ${position.left}px))` : 'translateX(-50%)',
                                                border: isActive ? '2px solid #f50' : '1px solid #333',
                                                pointerEvents: 'auto',
                                                cursor: 'pointer',
                                                zIndex: isActive ? 100 : position.zIndex,
                                                transition: 'all 0.2s ease',
                                                boxShadow: isActive ? '0 0 8px #f50' : 'none',
                                            }}
                                        >
                                            {comment.user?.name?.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                );
                            })}

                            {/* Comment preview avatar */}
                            {commentPreview.show && (
                                <Box
                                    onClick={handleCommentPreviewClick}
                                    sx={{
                                        position: 'absolute',
                                        left: `${commentPreview.position}%`,
                                        top: 0,
                                        bottom: 0,
                                        width: '2px',
                                        bgcolor: '#f50',
                                        pointerEvents: 'auto',
                                        cursor: 'pointer',
                                        '&::after': {
                                            content: '"+"',
                                            position: 'absolute',
                                            top: -20,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            color: '#f50',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            )}
                        </Box>
                        <Box sx={{ position: 'absolute', bottom: 5, right: 0, background: 'rgba(0,0,0,0.8)', px: 0.5, py: 0.2, fontSize: 12, color: '#ccc' }}>
                            {time} / {duration}
                        </Box>
                    </Box>
                </Box>

                {/* Actions bottom */}
                <Box sx={{ display: 'flex', gap: 1, pt: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FavoriteIcon fontSize="small" style={{ color: isLove ? '#f64a00' : '#ffffff' }} />}
                        onClick={()=>{
                            if(session) {
                                handleLikeClick()
                            }
                            else                                             router.push('/auth/signin');

                        }}
                        disabled={mutation.isPending}
                        sx={{
                            color: isLove ? '#f64a00' : 'white',
                            borderColor: isLove ? '#444' : '#444',
                            textTransform: 'none',
                            padding: '2px 8px',
                            minWidth: 0,
                            '&:hover': {
                                borderColor: isLove ? '#f50' : '#f50',
                                color: isLove ? '#f50' : '#f50'
                            },
                            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                            opacity: mutation.isPending ? 0.8 : 1
                        }}
                    >
                        {countLikes || 0}
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<RepeatIcon fontSize="small" />} sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Repost
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<IosShareIcon fontSize="small" />} sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Share
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<PlaylistAddIcon fontSize="small" />}
                            onClick={()=>{
                                if(session) {
                                    setShowPlaylistModal(true)                                }
                                else                                             router.push('/auth/signin');

                            }}
                            sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Add to playlist
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<ContentCopyIcon fontSize="small" />} sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
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
                            {comments.length}
                        </Box>
                    </Box>
                </Box>

                {/* Write a Comment Input - Show when track is playing */}
                {
                    isMatched && currentTrack.isPlaying && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #333' }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                variant="outlined"
                                placeholder="Write a comment..."
                                value={commentInput.content}
                                onChange={(e) => setCommentInput(prev => ({ ...prev, content: e.target.value }))}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#444',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#666',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#f50',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'white',
                                    },
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <MuiButton
                                    onClick={handleSubmitComment}
                                    disabled={!commentInput.content.trim()}
                                    sx={{
                                        bgcolor: '#f50',
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
                                    size="small"
                                >
                                    Post Comment
                                </MuiButton>
                            </Box>
                        </Box>
                    )
                }
            </Box >

            {/* Comment Input Modal for timestamped comments */}
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
                        Comment at {formatTimeUtil(commentInput.selectedTime)}
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
                                    borderColor: '#f50',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: 'white',
                            },
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <MuiButton
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
                        </MuiButton>
                        <MuiButton
                            onClick={handleSubmitComment}
                            disabled={!commentInput.content.trim()}
                            sx={{
                                bgcolor: '#f50',
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
                        </MuiButton>
                    </Box>
                </Box>
            </Modal>

            <AddToPlaylistModal
                open={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                trackId={Number(track.id)}
                imgUrl={track.imgUrl}
                title={track.title}
                uploader={track.uploader.name}
                uploaderId={track.uploader.id}
                trackUrl={track.trackUrl}
            />
        </Box>
    );
};
export default ProfileTrack;


