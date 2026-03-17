'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="m-auto flex h-screen w-[328px] flex-col justify-center">
      <h2 className="text-2xl font-semibold">Oops! The page is not found.</h2>

      <p className="mx-0 mt-5 mb-6 text-muted-foreground">
        The page you are looking for may have been removed, or the link you followed may be broken.
      </p>

      <Button onClick={() => router.replace('/')}>Go to homepage</Button>
    </div>
  );
}
