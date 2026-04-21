'use client'
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Headphones } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useCountTrackMutation, useLikeTrackMutation } from "@/hooks/use-track";
import { useSession } from "next-auth/react";
import { useTrackContext } from "@/lib/track.wrapper";

interface IProps {
    trackId: number;
    initialLikes: number;
    initialIsLiked: boolean;
    initialCountPlays: number;
}

const LikeTrack = (props: IProps) => {
    const { trackId, initialLikes, initialIsLiked, initialCountPlays } = props;
    const { data: session } = useSession();
    const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

    // Chỉ cần 2 state này để quản lý hiển thị
    const [countLikes, setCountLikes] = useState<number>(initialLikes);
    const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
    const [countPlays, setCountPlays] = useState<number>(initialCountPlays);

    // Sync with TrackContext when track ID matches
    useEffect(() => {
        setCountLikes(initialLikes);
        setIsLiked(initialIsLiked);
    }, [trackId, initialLikes, initialIsLiked]);

    // Sync isLiked with currentTrack when track ID matches
    useEffect(() => {
        if (Number(currentTrack.id) === trackId) {
            setIsLiked(currentTrack.isLiked);
        }
    }, [currentTrack.id, currentTrack.isLiked, trackId]);

    const mutation = useLikeTrackMutation();

    const handleLikeClick = () => {
        mutation.mutate(trackId, {
            onSuccess: (res) => {
                // res.data chính là ResTrackLike (Integer countLikes, Boolean isLiked)
                if (res?.data) {
                    setCountLikes(res.data.countLikes);
                    setIsLiked(res.data.isLiked);

                    // Update TrackContext if this is the current track
                    if (Number(currentTrack.id) === trackId) {
                        setCurrentTrack({
                            ...currentTrack,
                            isLiked: res.data.isLiked
                        });
                    }
                }
            }
        });
    };
    const handleIncreaseCountPlay = () => {
        mutation.mutate(trackId, {
            onSuccess: (res) => {
                if (res?.data) {
                    setCountPlays(res.data.countPlays);
                }
            }
        });
    };

    return (
        <div style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            {session ?
                <Stack direction="row" spacing={1}>
                    <Chip
                        onClick={handleLikeClick}
                        disabled={mutation.isPending}
                        sx={{
                            color: isLiked ? '#f64a00' : 'white',
                            borderColor: isLiked ? '#f64a00' : 'white',
                            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                            opacity: mutation.isPending ? 0.8 : 1,
                            '&:hover': {
                                borderColor: '#f50',
                                color: isLiked ? '#f50' : '#f50'
                            },
                            '& .MuiChip-icon': {
                                color: isLiked ? '#f64a00' : 'inherit'
                            },
                            '&:hover .MuiChip-icon': {
                                color: '#f50'
                            }
                        }}
                        icon={<FavoriteIcon />}
                        label={isLiked ? "Liked" : "Like"}
                        variant="outlined"
                    />
                </Stack>
                : <></>
            }

            <div style={{ display: 'flex', gap: '10px' }}>

                <Stack direction="row">
                    <Chip
                        sx={{ color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                        icon={<Headphones />}
                        label={(countPlays ?? 0).toLocaleString()}                    />
                </Stack>
                <Stack direction="row">
                    <Chip
                        sx={{ color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                        icon={<FavoriteIcon />}
                        label={(countLikes ?? 0).toLocaleString()}
                    />
                </Stack>
            </div>
        </div>
    );
}

export default LikeTrack;