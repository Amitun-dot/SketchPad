
import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SketchPad | Write naturally. Create freely.',
  description:
    'A premium handwriting notebook and whiteboard that runs in your browser. No account needed.',
  themeColor: '#E6E9ED',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
