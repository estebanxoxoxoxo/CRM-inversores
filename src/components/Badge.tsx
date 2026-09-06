import type { ReactNode } from "react";

/** Small pill with a colour class (band, confidence, rating, verdict…). Shared by both sections. */
export function Badge({ className, children, title }: { className: string; children: ReactNode; title?: string }) {
  return (
    <span className={`badge ${className}`} title={title}>
      {children}
    </span>
  );
}
