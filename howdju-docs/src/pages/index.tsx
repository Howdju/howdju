import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <div className="hero__subtitle">{siteConfig.tagline}</div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Documentation for the Howdju social factchecking platform."
    >
      <HomepageHeader />
      <main>
        <div className={styles.mainParagraph}>
          Learn about Howdju’s <Link to="docs/category/concepts">concepts</Link>{" "}
          and <Link to="docs/features">features</Link>. Access the Howdju
          application at <a href="https://howdju.com">howdju.com</a>.
        </div>
      </main>
    </Layout>
  );
}
