import type { Metadata } from 'next';

import LandingPage from './landing';

export const metadata: Metadata = {
  title: 'Ship | Modern SaaS Boilerplate',
  description: 'Ship your SaaS in days, not months. The high-performance toolkit for developers.',
};

export default function Home() {
  return <LandingPage />;
}
