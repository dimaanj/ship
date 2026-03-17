'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApiQuery } from 'hooks';

import { apiClient } from 'services/api-client.service';

import MainLayout from 'pages/_app/PageConfig/MainLayout';
import PrivateScope from 'pages/_app/PageConfig/PrivateScope';

import 'services/socket-handlers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: account, isLoading } = useApiQuery(apiClient.account.get);

  useEffect(() => {
    if (!isLoading && !account) {
      router.replace('/sign-in');
    }
  }, [account, isLoading, router]);

  if (isLoading || !account) return null;

  return (
    <PrivateScope>
      <MainLayout>{children}</MainLayout>
    </PrivateScope>
  );
}
