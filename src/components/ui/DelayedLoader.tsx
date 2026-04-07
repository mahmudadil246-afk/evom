import { useState, useEffect, ReactNode } from "react";

interface DelayedLoaderProps {
  children: ReactNode;
  delay?: number;
}

export function DelayedLoader({ children, delay = 300 }: DelayedLoaderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) return null;

  return <div className="animate-fade-in">{children}</div>;
}
