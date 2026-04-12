import { sendRequest } from "@/utils/api";
import { AuthOptions } from "next-auth";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
    secret: process.env.NO_SECRET,
    providers: [
        CredentialsProvider({
            name: "Gmail",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                const res = await sendRequest<IBackendRes<ILoginRes>>({
                    url: "http://localhost:8080/api/v1/auth/login",
                    method:"POST",
                    body:{
                        email: credentials?.username,
                        password: credentials?.password
                    },
                })
                if (res && res.data) {
                    // Any object returned will be saved in `user` property of the JWT
                    return res.data as any
                } else {
                    // If you return null then an error will be displayed advising the user to check their details.
                    return null

                    // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
                }
            }
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: {
                params: {
                    scope: "read:user user:email"
                }
            }
        }),

    ],
    callbacks: {
        async jwt({ token, user, account, profile, trigger }) {
            if (trigger === "signIn" && account?.provider !== "credentials") {
                const res = await sendRequest<IBackendRes<ILoginRes>>({
                    url: "http://localhost:8080/api/v1/auth/social-login",
                    method: "POST",
                    body: {
                        accessToken: account?.access_token,
                        type: account?.provider?.toLocaleUpperCase(),
                    }
                })
                if (res.data) {
                    token.access_token = res.data.access_token;
                    token.refresh_token = res.data.refresh_token;
                    token.user = res.data.user;
                }
            }
            if(trigger === "signIn" && account?.provider === "credentials"){
                //@ts-ignore
                token.access_token = user.access_token;
                //@ts-ignore
                token.refresh_token = user.refresh_token;
                //@ts-ignore
                token.user = user.user;
            }
            return token;
        },
        session({ session, token, user }) {
            if (token) {
                session.user = token.user;
                session.access_token = token.access_token;
                session.refresh_token = token.refresh_token;
            }
            return session;
        }
    },
    // pages:{
    //     signIn: "/auth/signIn"
    // }
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }