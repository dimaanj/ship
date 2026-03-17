'use client';

import { useApiQuery } from 'hooks';

import { apiClient } from 'services/api-client.service';

export default function DashboardPage() {
  const { data: account } = useApiQuery(apiClient.account.get);

  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-4xl">
          Welcome back{account?.firstName ? `, ${account.firstName}` : ''}!
        </h1>

        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          This is your dashboard. Start building something great!
        </p>
      </div>
    </div>
  );
}
