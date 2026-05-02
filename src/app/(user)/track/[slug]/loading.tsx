import {Box, Skeleton, Avatar, Container} from "@mui/material";

export default function Loading() {
    return (
        <div style={{backgroundColor:'#121212'}}>
            <Container style={{backgroundColor:'#121212'}}>
                <Box
                    sx={{
                        bgcolor: '#1a1a1a',
                        borderRadius: 2,
                        p: 3,
                        mb: 4
                    }}
                >
                    {/* ===== HEADER ===== */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        {/* Play button */}
                        <Skeleton
                            variant="circular"
                            width={50}
                            height={50}
                            sx={{ bgcolor: '#333' }}
                        />

                        <Box>
                            <Skeleton width={220} height={24} sx={{ bgcolor: '#333' }} />
                            <Skeleton width={100} height={18} sx={{ bgcolor: '#333' }} />
                        </Box>
                    </Box>

                    {/* ===== WAVEFORM ===== */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'end',
                            gap: '2px',
                            height: 120,
                            mb: 3,
                            overflow: 'hidden'
                        }}
                    >
                        {Array.from({ length: 160 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="rectangular"
                                width={2}
                                height={Math.random() * 100 + 10}
                                sx={{
                                    bgcolor: '#333',
                                    borderRadius: 1
                                }}
                            />
                        ))}
                    </Box>

                    {/* ===== ACTION BUTTONS ===== */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 20, bgcolor: '#333' }} />
                        <Skeleton variant="rectangular" width={140} height={36} sx={{ borderRadius: 20, bgcolor: '#333' }} />
                    </Box>

                    {/* ===== STATS ===== */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                        <Skeleton width={60} height={20} sx={{ bgcolor: '#333' }} />
                        <Skeleton width={60} height={20} sx={{ bgcolor: '#333' }} />
                    </Box>

                    {/* ===== COMMENT INPUT ===== */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#333' }} />
                        <Skeleton variant="rectangular" height={40} sx={{ flex: 1, borderRadius: 20, bgcolor: '#333' }} />
                        <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#333' }} />
                    </Box>
                </Box>
            </Container>

        </div>

    );
}
