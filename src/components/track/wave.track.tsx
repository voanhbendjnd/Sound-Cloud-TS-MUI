'use client'
import { useWaveSurfer } from "@/utils/customerHook";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import WaveSurfer from "wavesurfer.js";
import { WaveSurferOptions } from "wavesurfer.js";

const WaveTrack = () => {
    const searchParams = useSearchParams();
    const fileName = searchParams.get('audio');
    const containerRef = useRef<HTMLDivElement>(null);

    const optionsMemo = useMemo(() => ({
        waveColor: 'rgb(175, 169, 175)',
        progressColor: 'rgb(85, 83, 85)',
        url: fileName ? `/api?audio=${fileName}` : '',
    }), [fileName]);

    const waveSurfer = useWaveSurfer(containerRef, optionsMemo);

    const handlePlayPause = () => {
        if (waveSurfer) waveSurfer.playPause();
    };

    return (
        <div>
        <div ref= { containerRef } style = {{ minHeight: '128px' }
} />
    < button
onClick = { handlePlayPause }
className = "mt-4 px-4 py-2 bg-purple-600 text-white rounded"
    >
    Play / Pause
    </button>
    </div>
    )
}

export default WaveTrack;