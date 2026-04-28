# Build image
FROM node:22.14.0 as build
WORKDIR /app
COPY package*.json ./
RUN npm config set cache /app/.npm-cache --global
RUN npm ci --loglevel=error
COPY . .
RUN npm run build
RUN npm prune --production

# Production image
FROM node:22.14.0-alpine
ENV NODE_ENV production
RUN npm config set cache /app/.npm-cache --global
USER 3301
WORKDIR /app
COPY --chown=node:node --from=build /app/node_modules /app/node_modules
COPY --chown=node:node --from=build /app/.next /app/.next
COPY --chown=node:node --from=build /app/public /app/public
COPY --chown=node:node --from=build /app/package.json /app/package.json
EXPOSE 3000
CMD ["npm", "run", "start"]