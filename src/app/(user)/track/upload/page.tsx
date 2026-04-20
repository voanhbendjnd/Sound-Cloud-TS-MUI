import UploadTabs from "@/components/track/upload.tabs";
import { Container } from "@mui/material";

const UploadPage = () => {
    return (
        <div style={{ backgroundColor: '#212121', paddingTop: 50 }}>
            <Container>
                <UploadTabs />
            </Container>
        </div>
    )
}

export default UploadPage;