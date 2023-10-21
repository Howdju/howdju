import React from "react";

import { Card, CardContent } from "@/components/card/Card";

import mdSource from "./AboutPage.md";

import "./AboutPage.scss";
import { Page } from "@/components/layout/Page";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";

const AboutPage = () => (
  <Page id="about-page">
    <SingleColumnGrid>
      <Card>
        <CardContent dangerouslySetInnerHTML={{ __html: mdSource }} />
      </Card>
    </SingleColumnGrid>
  </Page>
);
export default AboutPage;
