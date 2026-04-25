import MainSlider from '@/components/main/main.slider';
import { Container } from '@mui/material';
import * as React from 'react';
import { sendRequest } from '@/utils/api';
import '@/styles/app.css'
import {getServerSession} from "next-auth";
import {Metadata} from "next";
export const metadata:Metadata ={
  title:'Discover the top streamed music and songs online DJ music',
  description:'Home music'
}
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
  // const session = await getServerSession(authOptions);
  // console.log('>>> Session', session);
  interface IUser {
    name: String;
    age: number;
  }

  const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
    url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks`,
    method: "GET",
    queryParams: {
      page: 1,
      size: 10,
      sort: "updatedAt,desc"
    },    nextOption: {
      cache: 'no-store'
    }
  });
  return (
    <div style={{ backgroundColor: '#212121' ,paddingTop:50}}>
      <Container>
        <MainSlider
          title="Trending"
          data={res?.data?.result ? res.data.result : []}
        />
      </Container>
    </div>
  )
}