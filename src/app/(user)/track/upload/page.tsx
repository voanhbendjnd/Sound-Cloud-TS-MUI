import UploadTabs from "@/components/track/upload.tabs";
import { Container } from "@mui/material";
import {useSession} from "next-auth/react";
import {redirect} from "next/navigation";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

const UploadPage =async () => {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin?callbackUrl=/upload");
    }
    return (
        <div style={{ backgroundColor: '#121212', paddingTop: 50 }}>
            <Container>
                <UploadTabs />
            </Container>
        </div>
    )
}

export default UploadPage;