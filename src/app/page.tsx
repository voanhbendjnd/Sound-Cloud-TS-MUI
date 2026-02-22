import MainSlider from '@/components/main/main.slider';
import { Container } from '@mui/material';
import * as React from 'react';
// import { sendRequestJS } from './../utils/old.api';
import { sendRequest } from '@/utils/api';
export default async function HomePage() {
  // const res = await fetch("http://localhost:8080/api/v1/tracks", {
  //   method: "GET",
  //   headers: {
  //     "Content-Type": "application.json",
  //   },
  //   // body: JSON.stringify({
  //   //   // category: "POP",
  //   //   page: 1,
  //   //   size: 5
  //   // })
  // })
  // console.log("Check data server: ", await res.json());
  interface IUser {
    name: String;
    age: number;
  }
  const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
    url: "http://localhost:8080/api/v1/tracks",
    method: "GET",
  });
  console.log(">>> Check response new year: ", res.data?.result)
  return (
    <div>
      <Container>
        <MainSlider
          data={res?.data?.result ? res.data.result : []}
        />
      </Container>
    </div>
  )
}