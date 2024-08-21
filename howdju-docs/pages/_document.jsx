import Document, { Html, Head, Main, NextScript } from 'next/document'
import { GoogleAnalytics } from '@next/third-parties/google'

export default class HowdjuDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <body>
          <GoogleAnalytics gaId="G-S7ZM5NB6RV" />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
