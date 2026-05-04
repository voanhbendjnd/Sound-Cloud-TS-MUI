'use client'

import React, { createContext, useContext, useRef, useState, useCallback } from "react";
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
        "peaks":"",
        isPlaying: false,
        isLiked: false,
    }
    const [currentTrack, setCurrentTrack] = useState<IShareTrack>(initValue as IShareTrack);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const savedTimes = useRef<Record<string, number>>({});
    const [viewedTracks, setViewedTracks] = useState<Set<string>>(new Set());

    // Playlist state
    const [currentPlaylist, setCurrentPlaylist] = useState<IPlaylist | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const markTrackAsViewed = (trackId: string) => {
        setViewedTracks(prev => new Set(prev).add(trackId));
    };

    const playNextTrack = useCallback(() => {
        if (playlistTracks.length === 0) return;

        const nextIndex = (currentTrackIndex + 1) % playlistTracks.length;
        const nextTrack = playlistTracks[nextIndex];

        if (nextTrack) {
            setCurrentTrack({
                id: nextTrack.id.toString(),
                title: nextTrack.title,
                description: "",
                category: "",
                imgUrl: nextTrack.imgUrl || "",
                trackUrl: nextTrack.trackUrl || "",
                peaks: "",
                countLike: nextTrack.countLikes || 0,
                countPlay: nextTrack.countPlays || 0,
                isLiked: false,
                uploader: {
                    id: nextTrack.uploader?.id?.toString() || "",
                    name: nextTrack.uploader?.name || "",
                    avatar: nextTrack.uploader?.avatar || ""
                },
                createdAt: "",
                updatedAt: "",
                isPlaying: true,
            });

            setCurrentTrackIndex(nextIndex);
        }
    }, [playlistTracks, currentTrackIndex, setCurrentTrack, setCurrentTrackIndex]);

    const playPreviousTrack = useCallback(() => {
        if (playlistTracks.length === 0) return;

        const prevIndex = (currentTrackIndex - 1 + playlistTracks.length) % playlistTracks.length;
        const prevTrack = playlistTracks[prevIndex];

        if (prevTrack) {
            setCurrentTrack({
                id: prevTrack.id.toString(),
                title: prevTrack.title,
                description: "",
                category: "",
                imgUrl: prevTrack.imgUrl || "",
                trackUrl: prevTrack.trackUrl || "",
                peaks: "",
                countLike: prevTrack.countLikes || 0,
                countPlay: prevTrack.countPlays || 0,
                isLiked: false,
                uploader: {
                    id: prevTrack.uploader?.id?.toString() || "",
                    name: prevTrack.uploader?.name || "",
                    avatar: prevTrack.uploader?.avatar || ""
                },
                createdAt: "",
                updatedAt: "",
                isPlaying: true,
            });

            setCurrentTrackIndex(prevIndex);
        }
    }, [playlistTracks, currentTrackIndex, setCurrentTrack, setCurrentTrackIndex]);

    return (
        <TrackContext.Provider value={{
            currentTrack,
            setCurrentTrack,
            audioRef,
            savedTimes,
            viewedTracks,
            markTrackAsViewed,
            currentPlaylist,
            setCurrentPlaylist,
            playlistTracks,
            setPlaylistTracks,
            currentTrackIndex,
            setCurrentTrackIndex,
            playNextTrack,
            playPreviousTrack
        }}>
            {children}
        </TrackContext.Provider>
    )
}

export const useTrackContext = () => useContext(TrackContext);