import MainSlider from '@/components/main/main.slider';
import { Container } from '@mui/material';
import * as React from 'react';

export default async function HomePage() {
  const res = await fetch("http://localhost:8080/api/v1/tracks", {
    method: "GET",
    headers: {
      "Content-Type": "application.json",
    },
    // body: JSON.stringify({
    //   // category: "POP",
    //   page: 1,
    //   size: 5
    // })
  })
  console.log("Check data server: ", await res.json());
  return (
    <div>
      <Container>
        <MainSlider />
      </Container>
    </div>
  )
}