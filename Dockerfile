# ── Trampolim — Production Dockerfile ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY react/package*.json ./react/
RUN cd react && npm ci

COPY react/ ./react/
COPY css/ ./css/
RUN cd react && npm run build

# ── Production image ──
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
COPY index.html manifest.json sw.js ./
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/
COPY --from=builder /app/react/dist ./react/dist

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/server.js"]
