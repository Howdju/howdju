import React from "react";

import { Card, CardContent } from "@/components/card/Card";

import mdSource from "./WhatsNextPage.md";

import "./WhatsNextPage.scss";

const WhatsNextPage = () => (
  <div className="md-grid" id="about-page">
    <Card className="md-cell--12">
      <CardContent dangerouslySetInnerHTML={{ __html: mdSource }} />
    </Card>
  </div>
);
export default WhatsNextPage;
