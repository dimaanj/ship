'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';

export default function GlobalErrorHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      const sanitizedError = DOMPurify.sanitize(decodeURIComponent(error), { ALLOWED_TAGS: [] });

      toast.error('Error', {
        description: sanitizedError,
      });

      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      router.replace(url.pathname + url.search);
    }
  }, [error, router]);

  return null;
}
