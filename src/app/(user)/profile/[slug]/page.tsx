import { sendRequest } from "@/utils/api";
import ProfileTrackList from "@/components/profile/ProfileTrackList";

const ProfilePage = async ({ params }: { params: { slug: string } }) => {
    const userId = params.slug;

    // Fetch initial tracks server-side
    const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/users/${userId}`,
        method: "GET",
        queryParams: {
            page: 1,
            size: 5,
            sort: "createdAt,desc"
        },
        nextOption: {
            cache: 'no-store'
        },
    });

    const initialTracks = res?.data?.result ?? [];
    const meta = res?.data?.meta;
    const initialTotal = meta?.total ?? 0;
    const initialHasMore = meta ? meta.page < meta.pages : false;

    return (
        <ProfileTrackList
            userId={userId}
            initialTracks={initialTracks}
            initialTotal={initialTotal}
            initialHasMore={initialHasMore}
        />
    )
}

export default ProfilePage;