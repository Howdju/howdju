import React, { ReactNode } from "react";
import cn from "classnames";

import "./ChatBubble.scss";

interface Props {
  className?: string;
  isPositive: boolean;
  isNegative: boolean;
  children: ReactNode;
}

export default function ChatBubble({
  className,
  isPositive,
  isNegative,
  children,
  ...rest
}: Props) {
  return (
    <div
      {...rest}
      className={cn(className, "chat-bubble", {
        "chat-bubble--positive": isPositive,
        "chat-bubble--negative": isNegative,
      })}
    >
      {children}
    </div>
  );
}
