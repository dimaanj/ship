# FSD Skeleton (Pet Project RTE RAG)

Структура Feature-Sliced Design для AI RAG Editor.
Создавать по мере реализации.

## Слои

```
src/
├── app/           # providers, routing
├── pages/         # editor-page, room-page
├── widgets/       # chat-room, brainstorm-editor, rag-panel, llm-stream
├── features/      # submit-query, stream-display, join-room, send-message, sync-document, insert-from-chat
├── entities/      # room, message, participant, document, document-block, search-result, citation, llm-chunk
└── shared/        # ui (VirtualResultsList), api, lib (normalizer)
```

## Следующие шаги

1. Добавить Plate.js в apps/web
2. Создать entities: room, message, document
3. Создать features: join-room, send-message
4. Создать widgets: chat-room, brainstorm-editor, rag-panel
