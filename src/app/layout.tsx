import * as React from 'react';
import ThemeRegistry from '@/components/theme-registry/theme.registry';
import AppFooter from '@/components/footer/app.footer';
import AppHeader from '@/components/headers/app.header';



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AppHeader />
          {children}
          <AppFooter />
        </ThemeRegistry>
      </body>
    </html>
  );
}
