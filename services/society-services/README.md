# society-services

Run locally:

1. Copy `.env.dev` to `.env` or set env vars.
2. `npm install`
3. `npm run dev`

Docker (example):

- Build: `docker build -t society-services .`
- Run: `docker run -e MONGO_URI=mongodb://... -p 4001:4001 society-services`
