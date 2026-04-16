import {sendRequest} from "@/utils/api";
import ProfileTrack from "@/components/track/profile.track";
import { Container, Typography, Box } from "@mui/material";

const ProfilePage = async({params}:{params:{slug:string}}) => {
    // Send public API request
    const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
        url: `http://localhost:8080/api/v1/tracks/users/${params.slug}?page=1&size=20`,
        method: "GET",
        nextOption: {
            cache: 'no-store'
        }
    });

    const tracks = res?.data?.result ?? [];
    const total = res?.data?.meta?.total ?? 0;

    return (
        <Box sx={{ minHeight: '100vh', background: '#222', py: 4 }}>
            <Container maxWidth="md">
                <Typography sx={{ color: '#999', mb: 3, fontWeight: 'bold' }}>
                    Found {total} tracks
                </Typography>
                <Box>
                    {tracks.map(track => (
                        <ProfileTrack key={track.id} track={track} />
                    ))}
                    {tracks.length === 0 && (
                        <Typography sx={{ color: '#666', mt: 4 }}>Chưa có bài hát nào được tải lên.</Typography>
                    )}
                </Box>
            </Container>
        </Box>
    )
}

export default ProfilePage;