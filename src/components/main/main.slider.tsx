'use client'
import React, { useState } from "react";
import Slider from "react-slick";
import { Settings } from "react-slick"
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Box, Button, Divider, Typography, useTheme, useMediaQuery, Chip, IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Link from "next/link";
import './home.css'
import Image from "next/image";
import { generateTrackUrl } from "@/utils/generate.slug";
import { useHistory } from "@/hooks/use.history";
import { useLikes } from "@/hooks/use.likes";
import { useCategories } from "@/hooks/use-category";
import { useTracks } from "@/hooks/use-track";
interface IProps {
    data: ITrack[],
    title: string,
}
const MainSlider = (props: IProps) => {
    // console.log(">>> check data: ", props.data)
    const { data, title } = props;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [activeCategory, setActiveCategory] = useState<string>("All");

    const { data: categoriesRes } = useCategories({ current: 1, pageSize: 20 });
    const categories = categoriesRes?.data?.result || [];

    const { data: filteredTracksRes, isLoading: isLoadingFiltered } = useTracks({
        current: 1,
        pageSize: 20,
        category: activeCategory !== "All" ? activeCategory : undefined
    });
    const filteredTracks = filteredTracksRes?.data?.result || [];

    // Fetch history and likes data
    const { data: historyData } = useHistory();
    const { data: likesData } = useLikes();
    const likedTracks =
        likesData?.pages.flatMap(page => page.data) || [];
    const historyTracks = historyData?.pages.flatMap(page => page.data) || [];
    // const likedTracks = likesData?.pages.flatMap(page => page.data) || [];

    const NextArrow = (props: any) => {
        return (
            <Box
                onClick={props.onClick}
                sx={{
                    position: "absolute",
                    right: 10,
                    top: 75,
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",

                    // 👇 style giống soundcloud
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(6px)",
                    transition: "all 0.2s ease",

                    "&:hover": {
                        background: "rgba(255,255,255,0.25)",
                        transform: "translateY(-50%) scale(1.1)",
                    }
                }}
            >
                <ChevronRightIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
        );
    };
    const PreArrow = (props: any) => {
        return (
            <Box
                onClick={props.onClick}
                sx={{
                    position: "absolute",
                    left: 10,
                    top: 75,
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",

                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(6px)",
                    transition: "all 0.2s ease",

                    "&:hover": {
                        background: "rgba(255,255,255,0.25)",
                        transform: "translateY(-50%) scale(1.1)",
                    }
                }}
            >
                <ChevronLeftIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
        );
    };
    const settings: Settings = {
        // dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: isMobile ? 2.5 : 4,
        slidesToScroll: 1,
        vertical: false,
        arrows: !isMobile,
        swipeToSlide: true,
        nextArrow: <NextArrow />,
        prevArrow: <PreArrow />

    };
    return (
        <Box
            sx={{
                backgroundColor: "#121212",
                color: "white",
                px: { xs: 2, sm: 3, md: 5 },
                py: 2,
            }}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "70% 30%",
                    },
                    gap: 2,
                    width: "100%",
                }}
            >
                {/* ================= LEFT CONTENT ================= */}
                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        overflow: "hidden",
                    }}
                >
                    {/* CATEGORY CHIPS */}
                    <Box sx={{
                        display: "flex",
                        gap: 1,
                        mb: 3,
                        overflowX: "auto",
                        pb: 1,
                        "&::-webkit-scrollbar": { display: "none" }
                    }}>
                        <Chip
                            label="All"
                            onClick={() => setActiveCategory("All")}
                            sx={{
                                bgcolor: activeCategory === "All" ? "#ff5500" : "#333",
                                color: activeCategory === "All" ? "#000" : "white",
                                fontWeight: activeCategory === "All" ? "bold" : "normal",
                                "&:hover": { bgcolor: activeCategory === "All" ? "##ff5500" : "#444" }
                            }}
                        />
                        {categories.map((cat: any) => (
                            <Chip
                                key={cat.id}
                                label={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                sx={{
                                    bgcolor: activeCategory === cat.name ? "#ff5500" : "#333",
                                    color: activeCategory === cat.name ? "#000" : "white",
                                    fontWeight: activeCategory === cat.name ? "bold" : "normal",
                                    "&:hover": { bgcolor: activeCategory === cat.name ? "#ff5500" : "#444" }
                                }}
                            />
                        ))}
                    </Box>

                    {activeCategory === "All" ? (
                        <>
                            {/* SECTION 1 */}
                            <Typography variant="h5" mb={2} fontWeight={700}>Multiple tracks</Typography>
                            <Slider {...settings}>
                                {data.map((track) => (
                                    <div className="track" key={track.id}>
                                        <Image
                                            width={150}
                                            height={150}
                                            alt="Image"
                                            className="img"
                                            src={track.imgUrl}
                                            style={{ width: "100%", height: "auto", aspectRatio: "1/1", borderRadius: 8, objectFit: "cover" }}
                                        />
                                        <Link
                                            href={generateTrackUrl(track)}
                                            style={{ textDecoration: "none", color: "white" }}
                                        >
                                            <Typography variant="body2"
                                                        className="track-title"
                                                        sx={{ fontWeight: 600, mt: 1 }}
                                            >{track.title}</Typography>
                                        </Link>
                                        <Typography variant="caption" sx={{ color: "#a7a7a7" }}>
                                            {track.uploader?.name || track.description}
                                        </Typography>
                                    </div>
                                ))}
                            </Slider>

                            <Divider sx={{ my: 3, backgroundColor: "#333" }} />

                            {/* SECTION 2 */}
                            <Typography variant="h5" mb={2} fontWeight={700}>Trending</Typography>
                            <Slider {...settings}>
                                {data.map((track) => (
                                    <div className="track" key={track.id}>
                                        <Image
                                            width={150}
                                            height={150}
                                            alt="Image"
                                            className="img"
                                            src={track.imgUrl}
                                            style={{ width: "100%", height: "auto", aspectRatio: "1/1", borderRadius: 8, objectFit: "cover" }}
                                        />
                                        <Link
                                            href={generateTrackUrl(track)}
                                            style={{ textDecoration: "none", color: "white" }}
                                        >
                                            <Typography variant="body2"
                                                        className="track-title"
                                                        sx={{ fontWeight: 600, mt: 1 }}
                                            >{track.title}</Typography>
                                        </Link>
                                        <Typography variant="caption" sx={{ color: "#a7a7a7" }}>
                                            {track.uploader?.name || track.description}
                                        </Typography>
                                    </div>
                                ))}
                            </Slider>

                            <Divider sx={{ my: 3, backgroundColor: "#333" }} />

                            {/* SECTION 3 */}
                            <Typography variant="h5" mb={2} fontWeight={700}>POP</Typography>
                            <Slider {...settings}>
                                {data.map((track) => (
                                    <div className="track" key={track.id}>
                                        <Image
                                            width={150}
                                            height={150}
                                            alt="Image"
                                            className="img"
                                            src={track.imgUrl}
                                            style={{ width: "100%", height: "auto", aspectRatio: "1/1", borderRadius: 8, objectFit: "cover" }}
                                        />
                                        <Link
                                            href={generateTrackUrl(track)}
                                            style={{ textDecoration: "none", color: "white" }}
                                        >
                                            <Typography variant="body2"
                                                        className="track-title"
                                                        sx={{ fontWeight: 600, mt: 1 }}
                                            >{track.title}</Typography>
                                        </Link>
                                        <Typography variant="caption" sx={{ color: "#a7a7a7" }}>
                                            {track.uploader?.name || track.description}
                                        </Typography>
                                    </div>
                                ))}
                            </Slider>
                        </>
                    ) : (
                        <>
                            {/* FILTERED RESULTS */}
                            <Typography variant="h5" mb={2} fontWeight={700}>{activeCategory} Tracks</Typography>
                            {isLoadingFiltered ? (
                                <Typography variant="body2" color="gray">Loading...</Typography>
                            ) : filteredTracks.length > 0 ? (
                                <Slider {...settings}>
                                    {filteredTracks.map((track: any) => (
                                        <div className="track" key={track.id}>
                                            <Image
                                                width={150}
                                                height={150}
                                                alt="Image"
                                                className="img"
                                                src={track.imgUrl}
                                                style={{ width: "100%", height: "auto", aspectRatio: "1/1", borderRadius: 8, objectFit: "cover" }}
                                            />
                                            <Link
                                                href={generateTrackUrl(track)}
                                                style={{ textDecoration: "none", color: "white" }}
                                            >
                                                <Typography variant="body2"
                                                            className="track-title"
                                                            sx={{ fontWeight: 600, mt: 1 }}
                                                >{track.title}</Typography>
                                            </Link>
                                            <Typography variant="caption" sx={{ color: "#a7a7a7" }}>
                                                {track.uploader?.name || track.description}
                                            </Typography>
                                        </div>
                                    ))}
                                </Slider>
                            ) : (
                                <Typography variant="body2" color="gray">No tracks found for this category.</Typography>
                            )}
                        </>
                    )}

                    {/* MOBILE ONLY */}
                    <Box sx={{ display: { xs: "block", sm: "none" }, mt: 4 }}>
                        <Typography variant="caption" sx={{ color: "#a7a7a7" }}>Jump into a session based on your tastes</Typography>
                        <Typography variant="h5" mb={2} fontWeight={700}>Start listening</Typography>
                        
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {(activeCategory !== "All" ? filteredTracks : data).slice(0, 5).map((track: any) => (
                                <Box key={track.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, overflow: "hidden" }}>
                                        <Image
                                            width={50}
                                            height={50}
                                            alt="Image"
                                            src={track.imgUrl}
                                            style={{ borderRadius: 4, objectFit: "cover" }}
                                        />
                                        <Box sx={{ overflow: "hidden" }}>
                                            <Link
                                                href={generateTrackUrl(track)}
                                                style={{ textDecoration: "none", color: "white" }}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {track.title}
                                                </Typography>
                                            </Link>
                                            <Typography variant="caption" sx={{ color: "#a7a7a7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                                                {track.uploader?.name || track.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton size="small" sx={{ color: "#a7a7a7" }}>
                                        <MoreHorizIcon />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* ================= RIGHT SIDEBAR ================= */}
                <Box
                    sx={{
                        width: "100%",
                        minWidth: 0,
                        display: { xs: "none", sm: "block" },
                        marginTop:isMobile ? 0 : 8,
                        // 💥 giống SoundCloud
                        position: { md: "sticky" },
                        top: { md: 80 },
                        height: "fit-content",
                        // maxHeight: { md: "calc(100vh - 100px)" },
                        // overflowY: "auto",
                        pr: 1,

                    }}
                >
                    {/* LIKED */}
                    <Box mb={3}>
                        <Typography variant="h6" mb={2}>Likes</Typography>

                        {likedTracks?.slice(0, 5).map((track: any) => (
                            <Box
                                key={track.id}
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    mb: 2,
                                    cursor: "pointer",
                                    "&:hover": { opacity: 0.8 },
                                }}
                            >
                                <Image
                                    src={track.imgUrl}
                                    alt="img"
                                    width={50}
                                    height={50}
                                    style={{ objectFit: "cover" }}
                                />

                                <Box>
                                    <Link
                                        href={generateTrackUrl(track)}
                                        style={{ textDecoration: "none", color: "white" }}
                                    >
                                        <Typography
                                            className="track-title"

                                            variant="body2">
                                            {track.title}
                                        </Typography>
                                    </Link>

                                    <Typography variant="caption" color="gray">
                                        {track.uploader.name}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <Divider sx={{ my: 2, backgroundColor: "#333" }} />

                    {/* HISTORY */}
                    <Box>
                        <Typography variant="h6" mb={2}>History</Typography>

                        {historyTracks?.slice(0, 5).map((track: any) => (
                            <Box
                                key={track.id}
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    mb: 2,
                                    cursor: "pointer",
                                    "&:hover": { opacity: 0.8 },
                                }}
                            >
                                <Image
                                    src={track.imgUrl}
                                    alt="img"
                                    width={50}
                                    height={50}
                                    style={{ objectFit: "cover" }}
                                />

                                <Box>
                                    <Link
                                        href={generateTrackUrl(track)}
                                        style={{ textDecoration: "none", color: "white" }}
                                    >
                                        <Typography
                                            className="track-title"

                                            variant="body2">
                                            {track.title}
                                        </Typography>
                                    </Link>

                                    <Typography variant="caption" color="gray">
                                        {track.uploader}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default MainSlider