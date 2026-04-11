import { sendRequest } from "@/utils/api";
import { AuthOptions } from "next-auth";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github"

export const authOption: AuthOptions = {
    secret: process.env.NO_SECRET,
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: {
                params: {
                    scope: "read:user user:email"
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, account, profile, trigger }) {
            if (trigger === "signIn" && account?.provider === "github") {
                const res = await sendRequest<IBackendRes<ILoginRes>>({
                    url: "http://localhost:8080/api/v1/auth/github-login",
                    method: "POST",
                    body: {
                        accessToken: account.access_token,
                        // email: user.email,
                        // name: user.name,
                        type: "GITHUB",
                        // avatar: user.image
                    }
                })
                if (res.data) {
                    token.accessToken = res.data.accessToken;

                    token.user = res.data.user;
                }
            }
            return token;
        },
        session({ session, token, user }) {
            if (token) {
                session.access_token = token.accessToken;
                session.user = token.user as any;
            }
            return session;
        }
    }
}
const handler = NextAuth(authOption)
export { handler as GET, handler as POST }