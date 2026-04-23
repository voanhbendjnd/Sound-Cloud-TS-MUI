import WaveTrack from '@/components/track/wave.track';
import { Container } from "@mui/material";
import { sendRequest } from "@/utils/api";
import CommentSection from "@/components/track/comment.section";
import { redirect } from "next/navigation";
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
    params: { slug: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const safeSlug = encodeURIComponent(params.slug);
    const audioDecoded = searchParams.audio;

    const audioOriginal = encodeURIComponent(String(audioDecoded));
    const res = await sendRequest<IBackendRes<ITrack>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${safeSlug}`,
        method: 'GET',
    })

    return {
        title: res.data?.title || "Track Detail",
        description: `Listening to ${res.data?.title}`,
        openGraph:{
            title:res.data?.title,
            description:res.data?.description,
            type:'website',
            images:[`https://github.com/voanhbendjnd/sharing-host-files/blob/master/DjndMusic/images/genshin-impact-lumine-5k-8k-1920x1080-5163.jpg?raw=true`],
            audio: audioDecoded,


        }
    }
}
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
    const resDataUploader = await sendRequest<IBackendRes<IUploader>>({
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
                    uploader={userUploader!}
                    comments={comments}
                    trackId={params.slug}
                />
            </Container>
        </div>


    )
}

export default DetailTrackPage;