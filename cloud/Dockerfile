FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    ORBIT_HOST=0.0.0.0 \
    ORBIT_PORT=8787 \
    ORBIT_DATABASE_PATH=/data/orbit-cloud.sqlite

WORKDIR /app
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node
VOLUME ["/data"]
EXPOSE 8787

CMD ["node", "src/index.mjs"]
