import UserTable from '@/components/admin/user/user.table';
import { Container } from '@mui/material';

export const metadata = {
    title: 'User Management | SoundCloud',
};

const ManageUserPage = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <UserTable />
        </Container>
    );
};

export default ManageUserPage;
