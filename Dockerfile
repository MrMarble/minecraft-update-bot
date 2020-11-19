FROM node:alpine as builder
# Development stage

RUN apk add git zsh curl
# Set zsh as default
RUN sed -i 's/sh/zsh/g' /etc/passwd
USER node:node
RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

FROM builder as build
# Build stage
USER root:root
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run compile

FROM node:alpine AS release

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/build ./build
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules

CMD ["npm", "start"]