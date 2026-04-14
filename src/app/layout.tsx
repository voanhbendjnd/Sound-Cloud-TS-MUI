import * as React from 'react';
import ThemeRegistry from '@/components/theme-registry/theme.registry';
import AppFooter from '@/components/footer/app.footer';
import AppHeader from '@/components/headers/app.header';
import '@/styles/app.css'


import NextAuthWrapper from '@/lib/next.auth.wrapper';
import QueryProvider from '@/lib/query.provider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <ThemeRegistry>
                    <NextAuthWrapper>
                        <QueryProvider>
                            {children}
                            <ToastContainer
                                position="top-right"
                                autoClose={5000}
                                hideProgressBar={false}
                                newestOnTop={false}
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                draggable
                                pauseOnHover
                                theme="light"
                            />
                        </QueryProvider>
                    </NextAuthWrapper>
                </ThemeRegistry>
            </body>
        </html>
    );
}
