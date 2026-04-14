import { Container } from '@mui/material';
import TrackTable from "@/components/admin/track/track.table";

export const metadata = {
    title: 'Track Management | SoundCloud',
    description: 'Manage your tracks, upload new music, and organize your collection.',
};

const ManageTrackPage = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <TrackTable/>
        </Container>
    );
};

export default ManageTrackPage;
