# Web panel (Next.js, standalone). Kontekst: repozitoriy ildizi.
#   docker build -f apps/web/Dockerfile -t erp-web .
# Muhit (ishga tushirishda): API_URL (masalan http://api:3001), WEB_SECURE_COOKIES (HTTPS orqasida true)
FROM node:24.18.0-alpine AS build
RUN npm install -g pnpm@12.18.0
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter "@erp/web..."
COPY apps/web apps/web
ENV NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1
# Shriftlar (next/font) shu bosqichda yuklab olinib, obrazga joylanadi: brauzer tashqi CDN'ga murojaat qilmaydi
RUN pnpm --filter @erp/web build

FROM node:24.18.0-alpine
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /repo/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/login" >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
