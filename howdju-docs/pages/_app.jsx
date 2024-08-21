import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { sendGAEvent } from '@next/third-parties/google'

const App = ({ Component, pageProps }) => {
  const router = useRouter()
  useEffect(() => {
    const handleRouteChange = (url) => {
      sendGAEvent({ action: 'page_view', page_path: url })
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return <Component {...pageProps} />
}

export default App
