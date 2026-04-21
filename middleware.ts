// middleware.ts
export { default } from "next-auth/middleware"

export const config = {
    matcher: [
        "/playlist/:path*",
        "/like/:path*",
        "/track/upload/:path*",
        "/dashboard/:path*"
    ]
}