'use client'

import React, {createContext, useContext, useRef, useState} from "react";
const TrackContext = createContext<ITrackContext | null>(null);
export const TrackContextProvider = ({children}:{children: React.ReactNode}) =>{
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
            "name":"",
            "role": ","
        },
        "createdAt": "",
        "updatedAt": "",
        isPlaying: false,
    }
    const [currentTrack, setCurrentTrack] = useState<IShareTrack>(initValue);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const savedTimes = useRef<Record<string, number>>({});

    return (
        <TrackContext.Provider value={{currentTrack, setCurrentTrack, audioRef, savedTimes}}>
            {children}
        </TrackContext.Provider>
    )
}

export const useTrackContext = () => useContext(TrackContext);