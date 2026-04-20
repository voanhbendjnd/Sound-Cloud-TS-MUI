'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Avatar, Typography, Divider, IconButton } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSession } from "next-auth/react";
import { useTrackContext } from "@/lib/track.wrapper";
import { SendSharp } from "@mui/icons-material";
import { useCreateComment, useFetchComments, commentKeys } from "@/hooks/use.comment";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Link from "next/link";

dayjs.extend(relativeTime);

interface IProps {
    comments: IComment[];
    trackId: string | null;
}

const CommentSection = (props: IProps) => {
    const { comments, trackId } = props;

    // Infinite scroll state
    const [currentPage, setCurrentPage] = useState(1);
    const [allComments, setAllComments] = useState<IComment[]>(comments);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<HTMLDivElement | null>(null);

    const commentParams = {
        current: currentPage,
        pageSize: 10, // Reduced from 100 to enable proper pagination
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    };
    const { data: resComments, isLoading } = useFetchComments(commentParams);
    const [newComment, setNewComment] = useState("");
    const { data: session } = useSession();
    const { currentTrack, audioRef, savedTimes } = useTrackContext() as ITrackContext;
    const queryClient = useQueryClient();
    const createCommentMutation = useCreateComment(commentParams);

    // Waveform uses a separate query with pageSize 100 — we need to invalidate it too
    const waveformCommentParams = {
        current: 1,
        pageSize: 100,
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    };

    // Update allComments when new data is fetched
    useEffect(() => {
        if (resComments?.data?.result) {
            const newComments = resComments.data.result;
            setAllComments(prev => {
                // Avoid duplicates
                const existingIds = new Set(prev.map(c => c.id));
                const filtered = newComments.filter(c => !existingIds.has(c.id));
                return [...prev, ...filtered];
            });

            // Check if there are more pages
            const meta = resComments.data.meta;
            if (meta) {
                setHasMore(meta.page < meta.pages);
            }
        }
    }, [resComments]);

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

    const handlePostComment = () => {
        const currentMoment = audioRef.current ? Math.round(audioRef.current.currentTime) : 0;
        if (!newComment.trim()) return;
        createCommentMutation.mutate(
            {
                track_id: Number(trackId),
                content: newComment,
                moment: currentMoment,
            },
            {
                onSuccess: () => {
                    setNewComment("");
                    // Also invalidate the waveform's comment cache so avatars appear immediately
                    queryClient.invalidateQueries({
                        queryKey: commentKeys.list(waveformCommentParams)
                    });
                }
            }
        )
        setNewComment("");
        toast.success("Post comment success");
    }

    const handleJumpToMoment = (moment: number) => {
        if (audioRef.current) {
            // 1. Thay đổi thời gian của thẻ audio thực
            audioRef.current.currentTime = moment;

            // 2. Nếu nhạc đang dừng, bạn có thể chọn tự động phát luôn
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));

            // 3. (Tùy chọn) Lưu lại thời gian vào savedTimes để đồng bộ
            const fileName = new URLSearchParams(window.location.search).get('audio');
            if (fileName) {
                savedTimes.current[fileName] = moment;
            }
        }
    };
    const formatMoment = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <Box sx={{ mt: 3, mb: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                {/* Chỉ hiện Avatar khi đã login */}
                {session && (
                    <>
                        <Avatar
                            src={session.user?.avatar}
                            sx={{ width: 40, height: 40 }}
                        >
                            {session.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>

                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Write a comment"
                            size="small"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            sx={{
                                background: '#303030',
                                '& .MuiOutlinedInput-root': { borderRadius: '1px' },
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#7e7e7e',
                                    opacity: 1,
                                },
                                '& .MuiInputBase-input': { color: '#fff' },
                            }}
                        />

                        <IconButton
                            onClick={handlePostComment}
                            sx={{ background: '#303030' }}
                            disabled={!session} // Khóa nút gửi nếu chưa login
                        >
                            <SendSharp sx={{ color: session ? '#f50' : '#7e7e7e' }} />
                        </IconButton>
                    </>


                )}

                {/* Thanh Input luôn hiện (hoặc tùy bạn muốn login mới hiện) */}

            </div>
            <Divider sx={{ my: 4, color: 'orange' }} />

            <Box sx={{ display: 'flex', gap: 4 }}>
                {/* Cột trái: Thông tin Uploader */}
                <Box sx={{ width: 150, textAlign: 'center' }}>
                    <Avatar
                        sx={{ width: 150, height: 150, mb: 1, border: '1px solid #eee' }}

                        src={currentTrack.uploader.avatar}
                    > {currentTrack.uploader.name.charAt(0).toUpperCase()}

                    </Avatar>
                    <Typography variant="body1" fontWeight="500" sx={{ color: "#fff" }}>
                        {currentTrack.uploader.name || "Unknown Uploader"}
                    </Typography>
                </Box>

                {/* Cột phải: Danh sách Comments */}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="#fff" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: '1px solid #eee', pb: 1 }}>
                        <ChatBubbleOutlineIcon fontSize="inherit" /> {allComments.length} comments
                    </Typography>

                    {allComments.map((comment) => {
                        const userAvatar = comment.user?.avatar
                            ? `${comment.user.avatar}`
                            : undefined;

                        return (
                            <Box key={comment.id} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <Avatar
                                    src={userAvatar}
                                    sx={{ width: 40, height: 40 }}
                                >
                                    {comment.user?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <Typography variant="caption" sx={{ color: '#fff' }}>
                                            <Link href={`/profile/${comment.user.id}`} style={{ textDecoration: 'none' }}>

                                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                                                {comment.user.email === session?.user.email ?
                                                    "You": comment.user.name}
                                            </span>
                                            </Link>
                                            <span style={{fontSize:13}}> at</span>
                                            {comment.moment !== undefined && (
                                                <span
                                                    onClick={() => handleJumpToMoment(comment.moment)}
                                                    style={{
                                                        fontSize: 13,
                                                        marginLeft: 5,
                                                        cursor: 'pointer',
                                                        color: '#ccc',
                                                        textDecoration: 'none'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff5500'} // Hover đổi màu cam giống SoundCloud
                                                    onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
                                                >{formatMoment(comment.moment)}
                                                </span>
                                            )}
                                        </Typography>
                                        <Typography variant="caption" color="#fff" sx={{ fontWeight: 'bold' }}>
                                            {dayjs(comment.createdAt).fromNow()}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: '#fff' }}>
                                        {comment.content}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}

                    {/* Loading indicator */}
                    {isLoading && (
                        <Box sx={{ textAlign: 'center', py: 2, color: '#999' }}>
                            Loading more comments...
                        </Box>
                    )}

                    {/* Observer target for infinite scroll */}
                    {hasMore && !isLoading && (
                        <div ref={observerRef} style={{ height: '20px' }} />
                    )}

                    {!hasMore && allComments.length > 0 && (
                        <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', mt: 2 }}>
                            No more comments
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CommentSection;