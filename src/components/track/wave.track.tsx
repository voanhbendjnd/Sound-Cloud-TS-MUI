'use client'
import { useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
const WaveTrack = () => {
    useEffect(() => {
        const element = document.getElementById("djnd");
        if (element) {
            WaveSurfer.create({
                container: document.getElementById("djnd"),
                waveColor: 'rgb(200, 0, 200)',
                progressColor: 'rgb(100, 0, 100)',
                url: '/audio/1771586892973-ytmp3free.cc_eleven-youtubemp3free.org.mp3',
            })
        }

    }, [])
    return (
        <div id="djnd">
            WakeTrack
        </div>
    )
}

export default WaveTrack;