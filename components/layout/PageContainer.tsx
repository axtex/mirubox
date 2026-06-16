import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps): React.JSX.Element {
  return <div className={className ? `page-container ${className}` : "page-container"}>{children}</div>;
}
