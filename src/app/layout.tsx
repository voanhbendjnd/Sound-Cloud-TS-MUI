import * as React from 'react';
import ThemeRegistry from '@/components/theme-registry/theme.registry';
import PrimarySearchAppBar from '@/components/headers/app.header';



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <PrimarySearchAppBar />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
