FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  chromium \
  git \
  unzip \
  libc6 \
  && rm -rf /var/lib/apt/lists/*

ARG GO_VERSION=1.24.3
RUN curl -fsSL -o /tmp/go.tar.gz \
  "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" \
  && rm -rf /usr/local/go \
  && tar -C /usr/local -xzf /tmp/go.tar.gz \
  && rm /tmp/go.tar.gz

ENV PATH="/usr/local/go/bin:$PATH"

ARG HUGO_VERSION=0.161.1
RUN curl -fsSL -o /tmp/hugo.tar.gz \
  "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz" \
  && tar -xzf /tmp/hugo.tar.gz -C /tmp \
  && mv /tmp/hugo /usr/local/bin/hugo \
  && rm /tmp/hugo.tar.gz

ENV CHROME_BIN=/usr/bin/chromium
ENV PUBLISH_SERVER_PORT=5555

COPY package*.json ./
RUN npm install

RUN npm install concurrently

COPY . .
RUN git clone --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
RUN hugo mod get -u

EXPOSE 1313
EXPOSE 4001
EXPOSE 5555

CMD ["npm", "run", "start:dokploy"]
