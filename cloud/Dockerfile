FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    DIYA_HOST=0.0.0.0 \
    DIYA_PORT=8787 \
    DIYA_DATABASE_PATH=/data/diya-cloud.sqlite

WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node
VOLUME ["/data"]
EXPOSE 8787

CMD ["node", "src/local-server.mjs"]
