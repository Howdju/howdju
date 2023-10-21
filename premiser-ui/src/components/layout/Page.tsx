import React from "react";
import cn from "classnames";

export interface PageProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * A top-level component for our web app pages. For now it just renders its
 * children, but later it can apply margins, etc.
 */
export function Page({ children, className, ...rest }: PageProps) {
  return (
    <div className={cn("page", className)} {...rest}>
      {children}
    </div>
  );
}
