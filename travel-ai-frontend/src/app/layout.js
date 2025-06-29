import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TravelAI - AI-Powered Travel Planning',
  description: 'Plan your perfect trip with AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="pt-16">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}