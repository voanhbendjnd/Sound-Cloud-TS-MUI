'use client'
import React from "react";
import Slider from "react-slick";
import { Settings } from "react-slick"
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Box, Button, Divider } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Link from "next/link";
import './home.css'
interface IProps {
    data: ITrack[],
    title: string,
}
const MainSlider = (props: IProps) => {
    // console.log(">>> check data: ", props.data)
    const { data, title } = props;

    const NextArrow = (props: any) => {
        return (
            <Button onClick={props.onClick} variant="contained"
                sx={{
                    position: "absolute",
                    right: 0,
                    top: "25%",
                    zIndex: 2,
                    minWidth: 30,
                    width: 35,
                    backgroundColor: "#282828",
                }}
            >
                <ChevronRightIcon />

            </Button>
        )
    }
    const PreArrow = (props: any) => {
        return (
            <Button
                variant="contained"
                onClick={props.onClick}
                sx={{
                    position: "absolute",
                    left: 0,
                    top: "25%",
                    zIndex: 2,
                    minWidth: 30,
                    width: 35,
                    backgroundColor: "#282828",

                }}
            >
                <ChevronLeftIcon />

            </Button>
        )
    }
    const settings: Settings = {
        // dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 5,
        slidesToScroll: 1,
        vertical: false,
        nextArrow: <NextArrow />,
        prevArrow: <PreArrow />

    };
    return (
        <Box sx={{
            backgroundColor: '#212121',
            margin: "0 50px",

            ".slick-slider": {
                display: "block"
            },

            ".slick-track": {
                display: "flex"
            },

            ".slick-slide": {
                display: "flex",
                justifyContent: "center"
            },

            ".track": {
                padding: "0 10px",
                textAlign: "center"
            },

            ".img": {
                height: 150,
                width: 150,
                objectFit: "cover"
            }
        }}>
            <h2>Multiple tracks</h2>
            <div>
                <Slider {...settings}>
                    {data.map(track => {
                        return (
                            <div className="track" key={track.id}>
                                <img className="img" src={`${track.imgUrl}`} />
                                <Link href={`/track/${track.id}?audio=${track.trackUrl}&id=${track.id}`} style={{ textDecoration: 'none' }}>
                                    <h4>{track.title}</h4>

                                </Link>
                                <h5>{track.description}</h5>
                            </div>
                        )
                    })}
                </Slider>
                <Divider />
            </div>
            <h2>Trending</h2>
            <div>
                <Slider {...settings}>
                    {data.map(track => {
                        return (
                            <div className="track" key={track.id}>
                                <img className="img" src={`${track.imgUrl}`} />
                                <Link href={`/track/${track.id}?audio=${track.trackUrl}&id=${track.id}`} style={{ textDecoration: 'none' }}>
                                    <h4>{track.title}</h4>

                                </Link>                                <h5>{track.description}</h5>
                            </div>
                        )
                    })}
                </Slider>
                <Divider />
            </div>
            <h2>POP</h2>
            <div>
                <Slider {...settings}>
                    {data.map(track => {
                        return (
                            <div className="track" key={track.id}>
                                <img className="img" src={`${track.imgUrl}`} />
                                <Link href={`/track/${track.id}?audio=${track.trackUrl}&id=${track.id}`} style={{ textDecoration: 'none' }}>
                                    <h4>{track.title}</h4>

                                </Link>
                                <h5>{track.description}</h5>
                            </div>
                        )
                    })}
                </Slider>
                <Divider />
            </div>
        </Box>


    );

}

export default MainSlider