FROM node:20-alpine

WORKDIR /app

COPY parser/package*.json ./
RUN npm install

COPY parser/ .

CMD ["node", "index.js"]
