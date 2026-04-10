"use client";

import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
import { useWaveSurfer } from "@/utils/customerHook";
import { WaveSurferOptions } from "wavesurfer.js";
import './wave.scss'
const WaveTrack = () => {
    const searchParams = useSearchParams();
    const fileName = searchParams.get("audio");
    const containerRef = useRef<HTMLDivElement>(null);

    const [gradients, setGradients] = useState<{
        wave: CanvasGradient;
        progress: CanvasGradient;
    } | null>(null);

    // 🎯 Create gradient (SOUNDCLOUD STYLE)
    useEffect(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const height = 100;

        canvas.height = height;

        // Wave color (gray)
        const waveGradient = ctx.createLinearGradient(0, 0, 0, height);
        waveGradient.addColorStop(0, "#747070");      // Top part (darker)
        waveGradient.addColorStop(0.7, "#747070");    // 70% height
        waveGradient.addColorStop(0.7, "#b3b3b3");    // Reflection transition
        waveGradient.addColorStop(1, "#b3b3b3");      // Bottom part (lighter)

        // Progress color (orange)
        const progressGradient = ctx.createLinearGradient(0, 0, 0, height);
        progressGradient.addColorStop(0, "#ff5500");   // Top progress
        progressGradient.addColorStop(0.7, "#ff5500"); // 70% height
        progressGradient.addColorStop(0.7, "#ffb18d"); // Reflection progress
        progressGradient.addColorStop(1, "#ffb18d");   // Bottom progress

        setGradients({
            wave: waveGradient,
            progress: progressGradient,
        });
    }, []);

    const optionsMemo = useMemo(
        (): Omit<WaveSurferOptions, "container"> => ({
            waveColor: gradients?.wave || "#555",
            progressColor: gradients?.progress || "#ff5500",
            url: fileName ? `/api?audio=${fileName}` : "",
            height: 130,
            barWidth: 3,
            barGap: 1,
            barRadius: 0,
            normalize: true,
            cursorWidth: 1,
            cursorColor: "transparent",
        }),
        [fileName, gradients]
    );

    const waveSurfer = useWaveSurfer(containerRef, optionsMemo);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!waveSurfer) return;
        const timeEl = document.querySelector('#time')!
        const durationEl = document.querySelector('#duration')!
        const subs = [
            waveSurfer.on("play", () => setIsPlaying(true)),
            waveSurfer.on("pause", () => setIsPlaying(false)),
            waveSurfer.on('decode', (duration) => (durationEl.textContent = formatTime(duration))),
            waveSurfer.on('timeupdate', (currentTime) => (timeEl.textContent = formatTime(currentTime)))
        ];

        return () => subs.forEach((unsub) => unsub());
    }, [waveSurfer]);

    const onPlayClick = useCallback(() => {
        if (!waveSurfer) return;
        waveSurfer.playPause();
    }, [waveSurfer]);
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.round(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }
    return (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-600 text-sm mb-2">wave track</div>
            <div ref={containerRef} className="wave-form-container">
                <div id="time">0:00</div>
                <div id="duration">0:00</div>
            </div>


            <button
                onClick={onPlayClick}
                className="mt-4 px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded shadow-sm hover:bg-gray-200 transition-colors"
            >
                {isPlaying ? "Pause" : "Play"}
            </button>
        </div>
    );
};

export default WaveTrack;