import React from "react";

interface Props {
  message: string;
}

export default function ErrorPage({ message }: Props) {
  return (
    <div className="md-grid">
      <div className="md-cell md-cell--12 text-center">{message}</div>
    </div>
  );
}
