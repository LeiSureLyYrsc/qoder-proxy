FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev
RUN test -x /app/node_modules/.bin/qoderclicn

COPY clean ./clean
COPY public ./public
COPY scripts ./scripts
COPY .env.example ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN mkdir -p /app/data && chown -R node:node /app

EXPOSE 3000

USER node

CMD ["npm", "start"]
