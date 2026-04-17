// 'use client'
import WaveTrack from '@/components/track/wave.track';
// import { useSearchParams } from 'next/navigation'
import { Container } from "@mui/material";
import { sendRequest } from "@/utils/api";
const DetailTrackPage = async (props: any) => {
    const { params } = props;
    // const searchParams = useSearchParams()
    // const search = searchParams.get('audio')
    const resComments = await sendRequest<IBackendRes<IModelPaginate<IComment>>>({
        url: `http://localhost:8080/api/v1/tracks/comments`,
        method: "GET",
        queryParams: {
            page: 1,
            size: 100,
            trackId: params.slug,
            sort: "updatedAt,desc"
        }
    })
    const comments = resComments.data?.result ?? [];
    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh', width: '100%' }}>

            <Container>
                <WaveTrack comments={comments} />
            </Container>
        </div>


    )
}

export default DetailTrackPage;