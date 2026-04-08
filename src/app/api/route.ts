import {NextRequest, NextResponse} from 'next/server'
export async function GET(request: NextRequest, response: NextResponse) {
    const url = new URL(request.url)
    const searchParams = new URLSearchParams(url.search);
    const fileName = searchParams.get("audio");
    return await fetch(`http://localhost:8080/api/v1/files/images/audio-tracks/${fileName}`);
}