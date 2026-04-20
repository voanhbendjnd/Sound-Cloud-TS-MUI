import RoleTable from '@/components/admin/role/role.table';
import { Container } from '@mui/material';

export const metadata = {
    title: 'Role Management | SoundCloud',
};

const ManageRolePage = () => {
    return (
        <div style={{ backgroundColor: '#212121', paddingTop: 50 }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <RoleTable />
            </Container>
        </div>
    );
};

export default ManageRolePage;
