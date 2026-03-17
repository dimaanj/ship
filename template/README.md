# Ship

> Full-Stack Node.js boilerplate — [Next.js](https://nextjs.org/) (App Router) + [NestJS](https://nestjs.com/) + [MongoDB](https://www.mongodb.com/) + [TypeScript](https://www.typescriptlang.org/)

## [Documentation](https://ship.paralect.com/docs/introduction)

## Tech Stack

| Layer | Technologies |
|---|---|
| **Web** | Next.js (App Router), Tanstack Query, React Hook Form, Tailwind CSS, shadcn/ui |
| **API** | NestJS, Zod validation, Mongoose |
| **Database** | MongoDB with Mongoose |
| **Shared** | Auto-generated typed API client, Zod schemas |
| **Infra** | Docker, Turborepo, Redis, GitHub Actions |
| **Deployment** | Yandex Cloud, Digital Ocean Apps, Render, Kubernetes |

## Prerequisites

This project requires Node.js ≥22.13.0 and npm. Please check the `engines` field in `package.json` for the required versions.

### Node.js

If you're using [nvm](https://github.com/nvm-sh/nvm), you can automatically switch to the correct Node.js version by running:
```sh
nvm use
```

This will read the version from the `.nvmrc` file and switch to it automatically.

### npm

npm comes bundled with Node.js. No additional setup required.

## Starting Application with Turborepo 🚀

To run the infrastructure and all services -- just run:
```sh
npm run start
```

### Running Infra and Services Separately with Turborepo

1. Start base infrastructure services in Docker containers:
    ```sh
    npm run infra
    ```
2. Run the services with Turborepo:
    ```sh
    npm run turbo-start
    ```

## Using Ship with Docker

To run the infrastructure and all services, execute:
```sh
npm run docker
```

### Running Infra and Services Separately with Docker

1. Start base infrastructure services in Docker containers:
    ```sh
    npm run infra
    ```
2. Run the services you need:
    ```sh
    ./bin/start.sh api web
    ```

You can also run infrastructure services separately using the `./bin/start.sh` bash script.

## Plugins

Extend your project with pre-built features:

```sh
npx create-ship-app@latest install <plugin-name>
```

Available plugins: `stripe-subscriptions`, `ai-chat`. See [Plugins docs](https://ship.paralect.com/docs/plugins/overview).
