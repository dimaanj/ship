# Pet Project: AI RAG Editor

AI-редактор на Plate.js с коллаборативным чатом, RAG и совместным документом brainstorm.

## Стек

- **Frontend**: Next.js (App Router), React, Tailwind, shadcn/ui
- **Backend**: NestJS, MongoDB, Socket.IO
- **RTE**: Plate.js (планируется)
- **RAG**: Elastic/Yandex Search (планируется)
- **Deploy**: Yandex Cloud

## Быстрый старт

```bash
cd pet-project-rte-rag

# 1. Скопировать apps и packages из Ship template
bash scripts/bootstrap-from-ship.sh

# 2. Установить зависимости
npm install

# 3. Скопировать .env
cp apps/api/.env.example apps/api/.env

# 4. Запустить
npm run start
```

> **Примечание**: `bootstrap-from-ship.sh` копирует `apps/` и `packages/` из `../template` (Ship). Запускайте из корня pet-project-rte-rag.

## Структура (FSD — планируется)

```
src/
├── app/           # providers, routing
├── pages/         # editor-page, room-page
├── widgets/       # chat-room, brainstorm-editor, rag-panel
├── features/      # submit-query, send-message, sync-document
├── entities/      # room, message, document, search-result
└── shared/        # ui, api, lib
```

## Документация

См. [.cursor/plans/pet_project_rte_rag_fb3e609a.plan.md](../.cursor/plans/pet_project_rte_rag_fb3e609a.plan.md)
