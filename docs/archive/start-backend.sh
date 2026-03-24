#!/bin/bash
# Start backend with correct environment
cd "$(dirname "$0")/backend"

export PORT=4000
export DATABASE_URL="postgresql://philippeschmitt@localhost:5432/prediction_market"

npm run dev
