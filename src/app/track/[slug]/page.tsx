'use client'
import { useSearchParams } from 'next/navigation'
const DetailTrackPage = (props: any) => {
    console.log("Checkkk logn: ", props)
    const { params } = props;
    const searchParams = useSearchParams()
    const search = searchParams.get('audio')
    return (
        <div>Detail Track Page</div>
    )
}

export default DetailTrackPage;