import PermissionTable from '@/components/admin/permission/permission.table';
import { Container } from '@mui/material';

export const metadata = {
    title: 'Permission Management | SoundCloud',
};

const ManagePermissionPage = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <PermissionTable />
        </Container>
    );
};

export default ManagePermissionPage;
