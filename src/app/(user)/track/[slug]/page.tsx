// 'use client'
import WaveTrack from '@/components/track/wave.track';
// import { useSearchParams } from 'next/navigation'
import { Container } from "@mui/material";
const DetailTrackPage = (props: any) => {
    // const { params } = props;
    // const searchParams = useSearchParams()
    // const search = searchParams.get('audio')
    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh', width: '100%' }}>

        <Container>
                <WaveTrack />
        </Container>
        </div>


    )
}

export default DetailTrackPage;