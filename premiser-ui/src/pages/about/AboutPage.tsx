import React from "react";
import { Grid, GridCell } from "@react-md/utils";

import { Card, CardContent } from "@/components/card/Card";

import mdSource from "./AboutPage.md";

import "./AboutPage.scss";

const AboutPage = () => (
  <Grid id="about-page">
    <GridCell colSpan={12} clone={true}>
      <Card>
        <CardContent dangerouslySetInnerHTML={{ __html: mdSource }} />
      </Card>
    </GridCell>
  </Grid>
);
export default AboutPage;
