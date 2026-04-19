'use client'
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Headphones } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useLikeTrackMutation } from "@/hooks/use-track";
import {useSession} from "next-auth/react";

interface IProps {
    trackId: number;
    initialLikes: number;
    initialIsLiked: boolean;
}

const LikeTrack = (props: IProps) => {
    const { trackId, initialLikes, initialIsLiked } = props;
    const { data: session } = useSession();
    // Chỉ cần 2 state này để quản lý hiển thị
    const [countLikes, setCountLikes] = useState<number>(initialLikes);
    const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);

    const mutation = useLikeTrackMutation();

    // Đồng bộ lại state khi props thay đổi (ví dụ chuyển bài hát)
    useEffect(() => {
        setCountLikes(initialLikes);
        setIsLiked(initialIsLiked);
    }, [trackId, initialLikes, initialIsLiked]);

    const handleLikeClick = () => {
        mutation.mutate(trackId, {
            onSuccess: (res) => {
                // res.data chính là ResTrackLike (Integer countLikes, Boolean isLiked)
                if (res?.data) {
                    setCountLikes(res.data.countLikes);
                    setIsLiked(res.data.isLiked);
                }
            }
        });
    };

    return (
        <div style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            {session ?             <Stack direction="row" spacing={1}>
                <Chip
                    onClick={handleLikeClick}
                    disabled={mutation.isPending}
                    style={{
                        color: isLiked ? '#f64a00' : 'white',
                        // borderColor: isLiked ? '#ff0000' : 'white',
                        cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                        opacity: mutation.isPending ? 0.8 : 1
                    }}
                    icon={<FavoriteIcon style={{ color: isLiked ? '#f64a00' : 'inherit' }} />}
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
                        label="1.2k"
                    />
                </Stack>
                <Stack direction="row">
                    <Chip
                        sx={{ color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                        icon={<FavoriteIcon />}
                        label={countLikes.toLocaleString()}
                    />
                </Stack>
            </div>
        </div>
    );
}

export default LikeTrack;