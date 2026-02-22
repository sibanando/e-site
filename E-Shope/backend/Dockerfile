FROM node:20-alpine

WORKDIR /app

# pg uses pure JS — no native compilation needed
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
