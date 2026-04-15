'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { useWaveSurfer } from "@/utils/customHook";
import { useTrackContext } from "@/lib/track.wrapper";
import { WaveSurferOptions } from 'wavesurfer.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import './wave.scss';
import {Tooltip} from "@mui/material";

const WaveTrack = () => {
    const searchParams = useSearchParams()
    const fileName = searchParams.get('audio');
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverRef = useRef<HTMLDivElement>(null);

    const [time, setTime] = useState<string>("0:00");
    const [duration, setDuration] = useState<string>("0:00");
    const { currentTrack, setCurrentTrack, audioRef, savedTimes } = useTrackContext() as ITrackContext;
    const isMatched = currentTrack.trackUrl === fileName;
    const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
        let gradient, progressGradient;
        if (typeof window !== "undefined") {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            // Define the waveform gradient
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35);
            gradient.addColorStop(0, '#656666') // Top color
            gradient.addColorStop((canvas.height * 0.7) / canvas.height, '#656666') // Top color
            gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
            gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
            gradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#B1B1B1') // Bottom color
            gradient.addColorStop(1, '#B1B1B1') // Bottom color

            // Define the progress gradient
            progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
            progressGradient.addColorStop(0, '#EE772F') // Top color
            progressGradient.addColorStop((canvas.height * 0.7) / canvas.height, '#EB4926') // Top color
            progressGradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
            progressGradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
            progressGradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#F6B094') // Bottom color
            progressGradient.addColorStop(1, '#F6B094') // Bottom color
        }

        return {
            waveColor: gradient,
            progressColor: progressGradient,
            height: 100,
            barWidth: 3,
            url: `/api?audio=${fileName}`,
        }
    }, []);
    const wavesurfer = useWaveSurfer(containerRef, optionsMemo);
    // Sync play/pause from global state
    useEffect(() => {
        if (!wavesurfer) return;
        wavesurfer.setVolume(0);

        const hover = hoverRef.current!;
        const waveform = containerRef.current!;
        const handlePointerMove = (e: PointerEvent) => (hover.style.width = `${e.offsetX}px`);
        waveform.addEventListener('pointermove', handlePointerMove);

        const subscriptions = [
            wavesurfer.on('decode', (d) => setDuration(formatTime(d))),
            wavesurfer.on('interaction', (newTime) => {
                if (isMatched && audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    savedTimes.current[fileName || ''] = newTime;
                    audioRef.current.play();
                }
            })
        ];

        return () => {
            waveform.removeEventListener('pointermove', handlePointerMove);
            subscriptions.forEach((unsub) => unsub());
        };
    }, [wavesurfer, isMatched, audioRef, fileName, savedTimes]);

    // Visually sync wavesurfer with global audio play progress
    useEffect(() => {
        if (!wavesurfer || !isMatched || !audioRef.current) return;
        
        const syncWavesurfer = () => {
            if (audioRef.current) {
                const diff = Math.abs(wavesurfer.getCurrentTime() - audioRef.current.currentTime);
                if (diff > 0.1) wavesurfer.setTime(audioRef.current.currentTime);
                setTime(formatTime(audioRef.current.currentTime));
            }
        };

        const audioEl = audioRef.current;
        audioEl.addEventListener('timeupdate', syncWavesurfer);
        audioEl.addEventListener('seeked', syncWavesurfer);

        // Initial sync
        syncWavesurfer();

        return () => {
            audioEl.removeEventListener('timeupdate', syncWavesurfer);
            audioEl.removeEventListener('seeked', syncWavesurfer);
        };
    }, [wavesurfer, isMatched, audioRef]);

    const onPlayClick = useCallback(() => {
        if (isMatched) {
            // Toggle
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({ ...currentTrack, isPlaying: willPlay } as any);
            if (willPlay && audioRef.current) {
                audioRef.current.play();
            } else if (!willPlay && audioRef.current) {
                audioRef.current.pause();
                savedTimes.current[fileName || ''] = audioRef.current.currentTime;
            }
        } else {
            // Save old track's time
            if (currentTrack.trackUrl && audioRef.current) {
                savedTimes.current[currentTrack.trackUrl] = audioRef.current.currentTime;
            }

            // Start new track (mock track object for footer)
            setCurrentTrack({
                id: fileName, // mock fallback
                trackUrl: fileName,
                title: "Unknown", // Can be fetched
                uploader: { name: "Unknown" },
                isPlaying: true
            } as any);

            // Wait for audio ready to restore saved playback time
            if (audioRef.current) {
                const onLoadedData = () => {
                    const savedTime = savedTimes.current[fileName || ''] || 0;
                    audioRef.current!.currentTime = savedTime;
                    wavesurfer?.setTime(savedTime);
                    audioRef.current!.play();
                    audioRef.current!.removeEventListener('loadeddata', onLoadedData);
                }
                audioRef.current.addEventListener('loadeddata', onLoadedData);
            }
        }
    }, [isMatched, currentTrack, fileName, setCurrentTrack, audioRef, savedTimes, wavesurfer]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.round(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }
    const arrComments = [
        {
            id: 1,
            avatar: "http://localhost:8080/api/v1/files/img-tracks/1771586892954-1503160828434_300.jpg",
            moment: 10,
            user: "username 1",
            content: "just a comment1"
        },
        {
            id: 2,
            avatar: "http://localhost:8080/api/v1/files/img-tracks/1771586892954-1503160828434_300.jpg",
            moment: 30,
            user: "username 2",
            content: "just a comment3"
        },
        {
            id: 3,
            avatar: "http://localhost:8080/api/v1/files/img-tracks/1771586892954-1503160828434_300.jpg",
            moment: 50,
            user: "username 3",
            content: "just a comment3"
        },
    ]
    const calculateLeft =(moment: number)=>{
        const hardCodeDuration = 312;
        const percent = (moment/hardCodeDuration) * 100;
        return `${percent}%`
    }

    return (
        <div style={{ marginTop: 20 }}>
            <div
                className="wave-background">
                <div className="left">
                    <div className="info" style={{ display: "flex" }}>
                        <div>
                            <div className="wave-button"
                                onClick={() => onPlayClick()}>
                                {currentTrack.isPlaying && isMatched ?
                                    <PauseIcon
                                        sx={{ fontSize: 30, color: "white" }}
                                    />
                                    :
                                    <PlayArrowIcon
                                        sx={{ fontSize: 30, color: "white" }}
                                    />
                                }
                            </div>
                        </div>
                        <div style={{ marginLeft: 20 }}>
                            <div style={{
                                padding: "0 5px",
                                background: "#333",
                                fontSize: 30,
                                width: "fit-content",
                                color: "white"
                            }}>
                                Spring song
                            </div>
                            <div style={{
                                padding: "0 5px",
                                marginTop: 10,
                                background: "#333",
                                fontSize: 20,
                                width: "fit-content",
                                color: "white"
                            }}
                            >
                                Next js
                            </div>
                        </div>
                    </div>
                    <div ref={containerRef} className="wave-form-container">
                        <div className="time" >{time}</div>
                        <div className="duration" >{duration}</div>
                        <div ref={hoverRef} className="hover-wave"></div>
                        <div className="overlay"
                             style={{
                                 position: "absolute",
                                 height: "30px",
                                 width: "100%",
                                 bottom: "0",
                                 // background: "#ccc"
                                 backdropFilter: "brightness(0.5)"
                             }}
                        ></div>
                        <div className="comments" >
                            {
                                arrComments.map(it =>{
                                    return (
                                        <Tooltip title={it.content} arrow>
                                            <img src={it.avatar} alt={it.avatar} key={it.id}
                                                 onPointerMove={(e)=>{
                                                     const hover = hoverRef.current!;
                                                     hover.style.width= calculateLeft(it.moment)
                                                 }}
                                                 style={{left:calculateLeft(it.moment)}}
                                            />
                                        </Tooltip>

                                    )
                                })
                            }
                            {/*<img src={`http://localhost:8080/api/v1/files/img-tracks/1771586892954-1503160828434_300.jpg`}  alt={`http://localhost:8080/api/v1/files/img-tracks/1771586892954-1503160828434_300.jpg`}/>*/}
                        </div>

                    </div>
                </div>
                <div className="right"
                     style={{
                         width: "25%",
                         padding: 15,
                         display: "flex",
                         alignItems: "center"
                     }}
                >
                    <div style={{
                        background: "#ccc",
                        width: 250,
                        height: 250
                    }}>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default WaveTrack;