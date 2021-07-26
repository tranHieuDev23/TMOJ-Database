# Build stage
FROM node:14.17.0-alpine AS build
# Install NodeJs dependencies
WORKDIR /build
COPY package.json ./
RUN npm install
# Build package
COPY . .
RUN npm run build
RUN npm prune --production

# Deploy stage
FROM node:14.17.0-alpine
# Create app directory
WORKDIR /usr/src/app
# Copy source from build to deploy
COPY --from=build /build/dist ./dist
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/package.json .
# Run server
EXPOSE 3000
CMD ["npm", "start"]