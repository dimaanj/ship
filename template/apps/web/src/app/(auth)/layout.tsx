'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApiQuery } from 'hooks/use-api.hook';

import { apiClient } from 'services/api-client.service';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: account, isLoading } = useApiQuery(apiClient.account.get);

  useEffect(() => {
    if (!isLoading && account) {
      router.replace('/app');
    }
  }, [account, isLoading, router]);

  if (isLoading || account) return null;

  return (
    <div className="grid min-h-screen grid-cols-1 sm:grid-cols-2">
      <div className="relative hidden h-screen sm:block">
        <Image src="/images/ship.svg" alt="App Info" fill className="object-cover object-left" priority />
      </div>

      <main className="flex h-screen w-full items-center justify-center px-8">{children}</main>
    </div>
  );
}
