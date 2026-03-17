'use client';

import Link from 'next/link';

import PublicHeader from '@/components/PublicHeader';

export default function RAGEditorLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            AI RAG Editor
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Коллаборативный редактор с AI-ассистентом, RAG и совместным документом brainstorm.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started
            </Link>
            <Link
              href="/sign-in"
              className="rounded-md border border-input bg-background px-8 py-3 text-sm font-medium hover:bg-accent"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
