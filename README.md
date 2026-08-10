This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloud Run

The `Dockerfile` creates a production image using Next.js standalone output. Cloud Run listens on port `8080` automatically.

Install and authenticate the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), then enable the required services once:

```bash
gcloud auth login
gcloud auth application-default login
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
pnpm deploy:cloud-run
```

The command deploys `pos-ventas-frontend` to `pos-ventas-503719` in `us-central1`. It sends the source to Google Cloud Build, installs dependencies with the lockfile, builds the image, and deploys it to Cloud Run without interactive questions. The Google OAuth client ID is set in the Docker build stage because Next.js embeds `NEXT_PUBLIC_*` variables in the client bundle.
