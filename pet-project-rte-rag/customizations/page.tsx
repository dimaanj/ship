import type { Metadata } from 'next';

import RAGEditorLanding from './landing';

export const metadata: Metadata = {
  title: 'AI RAG Editor',
  description: 'Коллаборативный редактор с AI-ассистентом, RAG и совместным документом brainstorm.',
};

export default function Home() {
  return <RAGEditorLanding />;
}
