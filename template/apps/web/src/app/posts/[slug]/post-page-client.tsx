'use client';

import { useMDXComponent } from '@content-collections/mdx/react';
import { allPosts } from 'content-collections';

interface PostPageClientProps {
  slug: string;
}

export default function PostPageClient({ slug }: PostPageClientProps) {
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) return null;

  const MDXContent = useMDXComponent(post.mdx);

  return (
    <div className="prose max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-li:text-foreground prose-a:text-primary prose-pre:bg-muted prose-pre:text-foreground">
      <MDXContent />
    </div>
  );
}
