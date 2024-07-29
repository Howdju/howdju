import React from "react";

import SingleColumnGrid from "@/components/layout/SingleColumnGrid";

interface Props {
  message: string;
}

export default function ErrorPage({ message }: Props) {
  return (
    <div>
      <SingleColumnGrid>{message}</SingleColumnGrid>
    </div>
  );
}
