import WaveTrack from '@/components/track/wave.track';
import { Container } from "@mui/material";
import { sendRequest } from "@/utils/api";
import CommentSection from "@/components/track/comment.section";
import { redirect } from "next/navigation";

const DetailTrackPage = async ({ params, searchParams }: {
    params: { slug: string },
    searchParams: { audio?: string, id?: string }
}) => {
    const slug = params?.slug;
    const fileName = searchParams.audio;
    const trackIdLast = searchParams.id;
    const trackId = Number(slug);
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
        },

    })
    const resDataUploader = await sendRequest<IBackendRes<IModelPaginate<IComment>>>({
        url: `http://localhost:8080/api/v1/tracks/avatar`,
        method: "GET",
        queryParams: {
            trackId: trackId,
        },
        nextOption: {
            cache: 'no-store'
        },

    })
    const checkParam = await sendRequest<IBackendRes<any>>({
        url: `http://localhost:8080/api/v1/tracks/isExists`,
        method: "GET",
        queryParams: {
            trackId: trackId,
            trackUrl: fileName,
            lastId: trackIdLast,
        },
        nextOption: {
            cache: 'no-store'
        },

    })
    if (!checkParam || (checkParam as any).statusCode >= 400) {
        redirect('/');
    }
    const userUploader = resDataUploader.data as IUploader | undefined;
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
                    avatarUploader={String(userUploader!.avatar)}
                    nameUploader={(String(userUploader!.name))}
                    comments={comments}
                    trackId={params.slug}
                />
            </Container>
        </div>


    )
}

export default DetailTrackPage;