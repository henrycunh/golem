# Use a builder stage to install and build dependencies
FROM node:16-alpine AS builder

WORKDIR /app

# Install pnpm globally and copy package files
COPY pnpm-lock.yaml package.json ./
COPY scripts/prepare.ts ./scripts/prepare.ts
RUN yarn global add pnpm && pnpm install

# Copy app source code and build for production
COPY . .
RUN pnpm run build
RUN ls

# Use a second stage to create a smaller image without build dependencies
FROM node:16-alpine

WORKDIR /app

# Copy built app from previous stage
COPY --from=builder /app/.output /app

# Expose the port and switch to non-root user
EXPOSE 3000
USER node

# Start the app by running the server entrypoint
CMD ["node", "./server/index.mjs"]