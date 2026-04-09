import { useEffect, useState } from "react"
import WaveSurfer, { WaveSurferOptions } from "wavesurfer.js";

export const useHasMounted = () => {
    const [hasMounted, setHasMounted] = useState<boolean>(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);
    return hasMounted;
}

export const useScript = (url: string) => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        document.body.appendChild(script);
    })
}
export const useWaveSurfer = (containerRef: React.RefObject<HTMLDivElement | null>, options: Omit<WaveSurferOptions, 'container'>) => {
    const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            ...options,
            container: containerRef.current
        });

        setWaveSurfer(ws);

        return () => {
            ws.destroy();
        };
    }, [containerRef, options]);

    return waveSurfer;
}
