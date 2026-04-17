'use client'
import React, { useState } from 'react';
import { Box, TextField, Avatar, Typography, Divider, IconButton } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSession } from "next-auth/react";
import { useTrackContext } from "@/lib/track.wrapper";
import { SendSharp } from "@mui/icons-material";
import { useCreateComment, useFetchComments } from "@/hooks/use.comment";

dayjs.extend(relativeTime);

interface IProps {
    comments: IComment[];
    trackId: string | null;
}

const CommentSection = (props: IProps) => {
    const { comments, trackId } = props;

    const commentParams = {
        current: 1,
        pageSize: 100,
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    };
    const { data: resComments } = useFetchComments(commentParams);
    const listComments = resComments?.data?.result ?? props.comments;
    const [newComment, setNewComment] = useState("");
    const { data: session } = useSession();
    const { currentTrack, audioRef } = useTrackContext() as ITrackContext;
    const createCommentMutation = useCreateComment(commentParams);
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
                }
            }
        )
        setNewComment("");
    }


    const formatMoment = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <Box sx={{ mt: 3, mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, background: '#121212', p: 1, borderRadius: 10 }}>
                {session ?
                    <Avatar
                    >
                        {session.user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    :
                    <Avatar sx={{ width: 40, height: 40 }}>

                    </Avatar>}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Write a comment"
                    size="small"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    sx={{
                        background: '#303030', '& .MuiOutlinedInput-root': { borderRadius: '1px' }, '& .MuiInputBase-input::placeholder': {
                            color: '#7e7e7e', // Màu xám nhạt cho placeholder
                            opacity: 1,    // Đảm bảo màu hiện rõ trên Chrome
                        },
                        '& .MuiInputBase-input': { color: '#fff' }, // Thêm dòng này
                    }}

                />
                <IconButton onClick={handlePostComment} sx={{ background: '#303030' }}>
                    <SendSharp />
                </IconButton>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', gap: 4 }}>
                {/* Cột trái: Thông tin Uploader */}
                <Box sx={{ width: 150, textAlign: 'center' }}>
                    <Avatar
                        sx={{ width: 150, height: 150, mb: 1, border: '1px solid #eee' }}

                        src={`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/files/img-tracks/${currentTrack.uploader.avatar}`}
                    > {currentTrack.uploader.name.charAt(0).toUpperCase()}

                    </Avatar>
                    <Typography variant="body1" fontWeight="500" sx={{ color: "#fff" }}>
                        {currentTrack.uploader.name || "Unknown Uploader"}
                    </Typography>
                </Box>

                {/* Cột phải: Danh sách Comments */}
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="#fff" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: '1px solid #eee', pb: 1 }}>
                        <ChatBubbleOutlineIcon fontSize="inherit" /> {comments.length} comments
                    </Typography>

                    {listComments.map((comment) => {
                        const userAvatar = comment.user?.avatar
                            ? `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/files/img-tracks/${comment.user.avatar}`
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
                                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>
                                                {comment.user.email === session?.user.email ?
                                                    comment.user.name : "You"}
                                            </span>
                                            {comment.moment !== undefined && (
                                                <span style={{ fontSize: 17 }}> at {formatMoment(comment.moment)}
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
                </Box>
            </Box>
        </Box>
    );
};

export default CommentSection;