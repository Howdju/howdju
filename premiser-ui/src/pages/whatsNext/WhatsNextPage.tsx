import React from "react";

import { Card, CardContent } from "@/components/card/Card";
import SingleColumnGrid from "@/components/layout/SingleColumnGrid";

import mdSource from "./WhatsNextPage.md";

import "./WhatsNextPage.scss";

const WhatsNextPage = () => (
  <div id="whats-next-page">
    <SingleColumnGrid>
      <Card>
        <CardContent dangerouslySetInnerHTML={{ __html: mdSource }} />
      </Card>
    </SingleColumnGrid>
  </div>
);
export default WhatsNextPage;
