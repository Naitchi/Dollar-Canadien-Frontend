import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta name="theme-color" content="#14273e" />
        <meta
          name="description"
          content="Dollar Canadien : le jeu de dés entre amis. Fais 30, ou fais mal. Le dernier debout gagne."
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
