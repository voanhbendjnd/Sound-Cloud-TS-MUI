'use client'

import React, { createContext, useContext, useRef, useState, useCallback } from "react";
import HistoryTrackingProvider from "@/lib/history.tracking.provider";

const TrackContext = createContext<ITrackContext | null>(null);

// ─── Safe track mapper ─────────────────────────────────────────────────────────
// FIX #1 — Centralise the raw→IShareTrack mapping so every caller
// goes through the same null-safe path. No more scattered `|| ""` guards.

const mapToShareTrack = (raw: any, isPlaying = true): IShareTrack => ({
    id:          String(raw?.id          ?? ''),
    title:       String(raw?.title       ?? ''),
    description: String(raw?.description ?? ''),
    category:    String(raw?.category    ?? ''),
    imgUrl:      String(raw?.imgUrl      ?? ''),
    trackUrl:    String(raw?.trackUrl    ?? ''),
    peaks:       String(raw?.peaks       ?? ''),
    countLike:   Number(raw?.countLikes  ?? raw?.countLike ?? 0),
    countPlay:   Number(raw?.countPlays  ?? raw?.countPlay ?? 0),
    isLiked:     Boolean(raw?.isLiked),
    isYoutube:   Boolean(raw?.isYoutube),
    isPlaying,
    uploader: {
        id:     String(raw?.uploader?.id     ?? ''),
        name:   String(raw?.uploader?.name   ?? ''),
        avatar: String(raw?.uploader?.avatar ?? ''),
    },
    createdAt: String(raw?.createdAt ?? ''),
    updatedAt: String(raw?.updatedAt ?? ''),
});

// ─── Initial state ─────────────────────────────────────────────────────────────

const INIT_TRACK: IShareTrack = mapToShareTrack({});

// ─── Provider ──────────────────────────────────────────────────────────────────

export const TrackContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<IShareTrack>(INIT_TRACK);
    const audioRef   = useRef<HTMLAudioElement | null>(null);
    const savedTimes = useRef<Record<string, number>>({});

    // FIX #2 — viewedTracks: spread into a new Set so React sees a new reference
    const [viewedTracks, setViewedTracks] = useState<Set<string>>(new Set());
    const markTrackAsViewed = useCallback((trackId: string) => {
        // @ts-ignore
        setViewedTracks(prev => new Set([...prev, trackId]));
    }, []);

    // ── Playlist state ───────────────────────────────────────────────────────
    const [currentPlaylist,    setCurrentPlaylist]    = useState<IPlaylist | null>(null);
    const [playlistTracks,     setPlaylistTracks]     = useState<any[]>([]);
    const [currentTrackIndex,  setCurrentTrackIndex]  = useState(0);

    // ── Navigation ───────────────────────────────────────────────────────────

    // FIX #3 — Read index through a ref inside the callback so the closure
    // is always fresh without listing currentTrackIndex in deps
    // (listing it causes the callback to be recreated on every track change,
    // which in turn triggers re-mounts in components that receive it as a prop).
    const currentIndexRef = useRef(currentTrackIndex);
    currentIndexRef.current = currentTrackIndex;

    const playNextTrack = useCallback(() => {
        setPlaylistTracks(tracks => {
            if (tracks.length === 0) return tracks;

            const nextIndex = (currentIndexRef.current + 1) % tracks.length;
            const next = tracks[nextIndex];

            // FIX #1 — safe mapping, no more .toString() crash
            if (next) {
                setCurrentTrack(mapToShareTrack(next, true));
                setCurrentTrackIndex(nextIndex);
                currentIndexRef.current = nextIndex;
            }

            return tracks;   // no mutation, return same ref
        });
    }, []);                  // stable — zero deps

    const playPreviousTrack = useCallback(() => {
        setPlaylistTracks(tracks => {
            if (tracks.length === 0) return tracks;

            const prevIndex = (currentIndexRef.current - 1 + tracks.length) % tracks.length;
            const prev = tracks[prevIndex];

            if (prev) {
                setCurrentTrack(mapToShareTrack(prev, true));
                setCurrentTrackIndex(prevIndex);
                currentIndexRef.current = prevIndex;
            }

            return tracks;
        });
    }, []);                  // stable — zero deps

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
            playPreviousTrack,
        }}>
            <HistoryTrackingProvider>
                {children}
            </HistoryTrackingProvider>
        </TrackContext.Provider>
    );
};

export const useTrackContext = () => useContext(TrackContext);

// ─── Re-export mapper so callers (search-bar, playlist-card…) ─────────────────
// can build a safe IShareTrack without copy-pasting the guard logic.
export { mapToShareTrack };