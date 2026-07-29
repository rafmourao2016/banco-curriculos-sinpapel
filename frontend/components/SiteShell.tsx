'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <div className={`site-loader ${loading ? 'site-loader--active' : ''}`} aria-hidden="true">
        <span />
      </div>
      <div className="page-enter">{children}</div>
    </>
  );
}
