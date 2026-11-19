# API (NestJS). Kontekst: repozitoriy ildizi.
#   docker build -f apps/api/Dockerfile -t erp-api .
# Ishga tushirish: node dist/main.js | migratsiya: node dist/db/migrate.js | seed: node dist/db/seed.js
# | birinchi super admin: node dist/db/create-super-admin.js
FROM node:24.18.0-alpine AS build
RUN npm install -g pnpm@12.18.0
WORKDIR /repo
# Avval faqat manifestlar: bog'liqliklar qatlami kod o'zgarganda qayta yuklanmaydi
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter "@erp/api..."
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @erp/shared build && pnpm --filter @erp/api build
# Faqat production bog'liqliklari bilan mustaqil papka (dist, drizzle migratsiyalari, @erp/shared)
RUN pnpm --filter @erp/api deploy --prod /out

FROM node:24.18.0-alpine
ENV NODE_ENV=production API_PORT=3001
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /out ./
USER app
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- "http://127.0.0.1:${API_PORT}/health" >/dev/null || exit 1
CMD ["node", "dist/main.js"]
