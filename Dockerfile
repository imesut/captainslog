FROM node:20-bullseye-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  chromium \
  unzip \
  && rm -rf /var/lib/apt/lists/*

ARG HUGO_VERSION=0.116.0
RUN curl -fsSL -o /tmp/hugo.tar.gz \
  "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz" \
  && tar -xzf /tmp/hugo.tar.gz -C /tmp \
  && mv /tmp/hugo /usr/local/bin/hugo \
  && rm /tmp/hugo.tar.gz

ENV CHROME_BIN=/usr/bin/chromium
ENV PUBLISH_SERVER_PORT=5555

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 1313

CMD ["npm", "run", "dev:dokploy"]
