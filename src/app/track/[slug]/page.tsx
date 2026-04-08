'use client'
import WaveTrack from '@/components/track/wave.track';
import { useSearchParams } from 'next/navigation'
const DetailTrackPage = (props: any) => {
    console.log("Checkkk logn: ", props)
    const { params } = props;
    const searchParams = useSearchParams()
    const search = searchParams.get('audio')
    return (
        <div>
            <WaveTrack />
        </div>
    )
}

export default DetailTrackPage;