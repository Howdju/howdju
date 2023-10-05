import React from "react";
import { Card, CardContent } from "@/components/card/Card";

import mdSource from "./AboutPage.md";

import "./AboutPage.scss";

const AboutPage = () => (
  <div className="md-grid" id="about-page">
    <Card className="md-cell--12">
      <CardContent>
        <CardContent dangerouslySetInnerHTML={{ __html: mdSource }} />
      </CardContent>
    </Card>
  </div>
);
export default AboutPage;
