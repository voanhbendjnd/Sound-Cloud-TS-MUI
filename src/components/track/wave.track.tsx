"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWaveSurfer } from "@/utils/customerHook";
import {WaveSurferOptions} from "wavesurfer.js";

const WaveTrack = () => {
  const searchParams = useSearchParams();
  const fileName = searchParams.get("audio");
  const containerRef = useRef<HTMLDivElement>(null);

  const optionsMemo = useMemo(():Omit<WaveSurferOptions, 'container'> => {
      return {
          waveColor: "rgb(175, 169, 175)",
          progressColor: "rgb(85, 83, 85)",
          url: `/api?audio=${fileName}`,
          barWidth: 2
      }
    }, [fileName]);

  const waveSurfer = useWaveSurfer(containerRef, optionsMemo);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!waveSurfer) return;

    setIsPlaying(false);

    const subscriptions = [
      waveSurfer.on("play", () => setIsPlaying(true)),
      waveSurfer.on("pause", () => setIsPlaying(false)),
    ];
    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [waveSurfer]);
  const onPlayClick = useCallback(() => {
    if (!waveSurfer) return;
    waveSurfer.isPlaying() ? waveSurfer.pause() : waveSurfer.play();
  }, [waveSurfer]);

  return (
    <div>
      <div ref={containerRef}>
        Wave Track
      </div>
      <button onClick={onPlayClick}>
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
};

export default WaveTrack;
