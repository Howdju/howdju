import { useEffect } from "react";
import { useRouter } from "next/router";
import * as gtag from "../lib/gtag";

const GA_TRACKING_ID = "G-S7ZM5NB6RV";

const App = ({ Component, pageProps }) => {
  const router = useRouter();
  useEffect(() => {
    if (doAnalytics()) {
      if (!hasGaScript()) {
        addGaScript();
      }
      gtag.pageView();
    }
    const handleRouteChange = (url) => {
      if (doAnalytics()) {
        gtag.pageView();
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
};

function hasGaScript() {
  return !!document.querySelector(
    "script[src*='googletagmanager.com/gtag/js']"
  );
}

function addGaScript() {
  const script = document.createElement("script");
  /* We cannot render the GA element from @next/third-parties conditionally based on the user's preference. */
  /* eslint-disable @next/next/next-script-for-ga */
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  script.async = true;
  document.body.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_TRACKING_ID);
}

function doAnalytics() {
  const cookieConsents = JSON.parse(
    window.localStorage.getItem("cookie-consent-preferences")
  );
  if (!cookieConsents) {
    return true;
  }
  return cookieConsents?.find((consent) => consent.id === "analytics").accepted;
}

export default App;
