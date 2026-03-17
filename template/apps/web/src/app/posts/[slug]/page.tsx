import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allPosts } from 'content-collections';
import { ArrowLeft, User } from 'lucide-react';

import type { Metadata } from 'next';

import PostPageClient from './post-page-client';

import { Button } from '@/components/ui/button';

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return allPosts
    .filter((post) => post.published)
    .map((post) => ({
      slug: post.slug,
    }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl p-4 sm:p-6">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/blog">
          <ArrowLeft className="mr-2 size-4" />
          Back to Blog
        </Link>
      </Button>

      <header className="mb-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mb-4 text-3xl font-bold leading-tight text-foreground sm:text-4xl">{post.title}</h1>

        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted">
            {post.authorImage ? (
              <Image src={post.authorImage} alt={post.authorName} fill className="object-cover" />
            ) : (
              <User className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{post.authorName}</span>
            <span className="text-sm text-muted-foreground">{post.date}</span>
          </div>
        </div>
      </header>

      {post.image && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-2xl">
          <Image src={post.image} alt={post.title} fill className="object-cover" priority />
        </div>
      )}

      <PostPageClient slug={slug} />
    </article>
  );
}
