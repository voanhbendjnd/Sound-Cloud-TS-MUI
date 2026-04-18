// 'use client'
import WaveTrack from '@/components/track/wave.track';
// import { useSearchParams } from 'next/navigation'
import { Container } from "@mui/material";
import { sendRequest } from "@/utils/api";
import CommentSection from "@/components/track/comment.section";
import { redirect } from "next/navigation";
const DetailTrackPage = async (props: any) => {
    const { params } = props;
    // const searchParams = useSearchParams()
    // const search = searchParams.get('audio')
    const slug = params?.slug; // Lấy slug từ dynamic route
    const trackId = Number(slug); // Ép kiểu sang số

    if (isNaN(trackId)) {
        redirect('/');
    }
    const resComments = await sendRequest<IBackendRes<IModelPaginate<IComment>>>({
        url: `http://localhost:8080/api/v1/tracks/comments`,
        method: "GET",
        queryParams: {
            page: 1,
            size: 20,
            trackId: trackId,
            sort: "updatedAt,desc"
        },
        nextOption: {
            cache: 'no-store'
        }
    })
    const comments = resComments.data?.result ?? [];
    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
            <div style={{ background: '#121212' }}>
                <Container>
                    <WaveTrack comments={comments} />
                </Container>
            </div>

            <Container sx={{ mt: 3 }}>
                <CommentSection
                    comments={comments}
                    trackId={params.slug}
                />
            </Container>
        </div>


    )
}

export default DetailTrackPage;