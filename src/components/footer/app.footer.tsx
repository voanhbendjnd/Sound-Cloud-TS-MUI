'use client'
import { useHasMounted } from "@/utils/customerHook";
import { AppBar, Container } from "@mui/material";
import AudioPlayer from 'react-h5-audio-player';
// @ts-expect-error - slick-carousel lacks type declarations
import 'react-h5-audio-player/lib/styles.css';
const AppFooter = () => {
    const hasMounted = useHasMounted();
    if (!hasMounted) return (<></>)
    return (
        <div>
            <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0, background: "#f2f2f2" }}>
                <Container sx={{ display: "flex", gap: 10 }}>
                    <AudioPlayer
                        style={{ boxShadow: "unset", background: "#f2f2f2" }}
                        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"
                        volume={0.5}
                    />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "start", justifyContent: "center", minWidth: 100 }}>
                        <div style={{ color: "#ccc" }}>Djnd</div>
                        <div style={{ color: "black" }}>Who am I?</div>
                    </div>

                </Container>

            </AppBar>

        </div>
    )
}

export default AppFooter;