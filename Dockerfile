FROM node:20-alpine AS build

RUN apk add --no-cache openssl

WORKDIR /app

ENV DATABASE_URL="file:/tmp/build.sqlite"

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npx prisma generate && npm run build && npm prune --omit=dev

FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

COPY package.json package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts

CMD ["npm", "run", "docker-start"]
