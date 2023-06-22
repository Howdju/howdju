import Metascraper from "metascraper";
import MetascraperAudio from "metascraper-audio";
import MetascraperAuthor from "metascraper-author";
import MetascraperDate from "metascraper-date";
import MetascraperDescription from "metascraper-description";
import MetascraperFeed from "metascraper-feed";
import MetascraperImage from "metascraper-image";
import MetascraperIframe from "metascraper-iframe";
import MetascraperLang from "metascraper-lang";
import MetascraperLogo from "metascraper-logo";
import MetascraperLogoFavicon from "metascraper-logo-favicon";
import MetascraperMediaProvider from "metascraper-media-provider";
import MetascraperPublisher from "metascraper-publisher";
import MetascraperReadability from "metascraper-readability";
import MetascraperTitle from "metascraper-title";
import MetascraperUrl from "metascraper-url";
import MetascraperVideo from "metascraper-video";
import MetascraperClearbit from "metascraper-clearbit";
import MetascraperInstagram from "metascraper-instagram";
import MetascraperManifest from "metascraper-manifest";
import MetascraperSoundcloud from "metascraper-soundcloud";
import MetascraperTelegram from "metascraper-telegram";
import MetascraperSpotify from "metascraper-spotify";
import MetascraperTwitter from "metascraper-twitter";
import MetascraperYoutube from "metascraper-youtube";

export const metascraper = Metascraper([
  MetascraperAudio(),
  MetascraperAuthor(),
  MetascraperDate(),
  MetascraperDescription(),
  MetascraperFeed(),
  MetascraperImage(),
  MetascraperIframe(),
  MetascraperLang(),
  MetascraperLogo(),
  MetascraperLogoFavicon(),
  MetascraperMediaProvider(),
  MetascraperPublisher(),
  MetascraperReadability(),
  MetascraperTitle(),
  MetascraperUrl(),
  MetascraperVideo(),
  MetascraperClearbit(),
  MetascraperInstagram(),
  MetascraperManifest(),
  MetascraperSoundcloud(),
  MetascraperTelegram(),
  MetascraperSpotify(),
  MetascraperTwitter(),
  MetascraperYoutube(),
]);
