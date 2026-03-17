import { FC, ReactNode } from 'react';

import PublicHeader from '@/components/PublicHeader';

const PublicLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <PublicHeader />

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
