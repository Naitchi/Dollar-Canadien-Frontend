import type { AppProps } from 'next/app';
import { Fredoka } from 'next/font/google';
import Head from 'next/head';
import { Provider } from 'react-redux';

import { AnnouncerProvider } from '@/components/Announcer/Announcer';
import store from '../store/store';

import '../styles/tokens.css';
import '../styles/globals.css';

// One variable font file covers every weight we use (self-hosted by Next).
const fredoka = Fredoka({ subsets: ['latin'], display: 'swap' });

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      {/* On :root so that dialogs and portals get the font too. */}
      <style jsx global>{`
        :root {
          --font-display: ${fredoka.style.fontFamily}, ui-rounded, 'Segoe UI', system-ui, sans-serif;
        }
      `}</style>
      <Provider store={store}>
        <AnnouncerProvider>
          <Component {...pageProps} />
        </AnnouncerProvider>
      </Provider>
    </>
  );
}

export default MyApp;
