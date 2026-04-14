import CategoryTable from '@/components/admin/category/category.table';
import { Container } from '@mui/material';

export const metadata = {
    title: 'Category Management | SoundCloud',
    description: 'Manage genres and track categories.',
};

const ManageCategoryPage = () => {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <CategoryTable />
        </Container>
    );
};

export default ManageCategoryPage;
