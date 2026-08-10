#!/usr/bin/env bash

set -euo pipefail

gcloud run deploy pos-ventas-frontend \
  --source . \
  --project pos-ventas-503719 \
  --region us-central1 \
  --allow-unauthenticated \
  --quiet
