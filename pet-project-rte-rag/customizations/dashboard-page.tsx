'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

import { useApiQuery } from 'hooks';
import { apiClient } from 'services/api-client.service';

import { Button } from '@/components/ui/button';

export default function RAGEditorDashboard() {
  const { data: account } = useApiQuery(apiClient.account.get);

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-4xl">
          Welcome back{account?.firstName ? `, ${account.firstName}` : ''}!
        </h1>

        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Start your first document
        </p>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/app/editor" className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              New document
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
