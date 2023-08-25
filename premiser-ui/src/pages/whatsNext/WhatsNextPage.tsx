import React from "react";
import { Card, CardText } from "react-md";

import mdSource from "./WhatsNextPage.md";

import "./WhatsNextPage.scss";

const WhatsNextPage = () => (
  <div className="md-grid" id="about-page">
    <Card className="md-cell--12">
      <CardText>
        <CardText dangerouslySetInnerHTML={{ __html: mdSource }} />
      </CardText>
    </Card>
  </div>
);
export default WhatsNextPage;
