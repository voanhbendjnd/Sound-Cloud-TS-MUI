'use client'

import React, { createContext, useContext, useRef, useState } from "react";
const TrackContext = createContext<ITrackContext | null>(null);
export const TrackContextProvider = ({ children }: { children: React.ReactNode }) => {
    const initValue = {
        "id": "",
        "title": "",
        "description": "",
        "category": "",
        "imgUrl": "",
        "trackUrl": "",
        "countLike": 0,
        "countPlay": 0,
        "uploader": {
            "id": "",
            "email": "",
            "name": "",
            "role": ",",
            "avatar": ""
        },
        "createdAt": "",
        "updatedAt": "",
        isPlaying: false,
        isLiked: false,
    }
    const [currentTrack, setCurrentTrack] = useState<IShareTrack>(initValue);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const savedTimes = useRef<Record<string, number>>({});
    const [viewedTracks, setViewedTracks] = useState<Set<string>>(new Set());

    const markTrackAsViewed = (trackId: string) => {
        setViewedTracks(prev => new Set(prev).add(trackId));
    };

    return (
        <TrackContext.Provider value={{ currentTrack, setCurrentTrack, audioRef, savedTimes, viewedTracks, markTrackAsViewed }}>
            {children}
        </TrackContext.Provider>
    )
}

export const useTrackContext = () => useContext(TrackContext);