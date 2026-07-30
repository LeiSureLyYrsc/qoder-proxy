FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then \
        npm install -g pnpm && pnpm install --frozen-lockfile --prod; \
    elif [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm install --omit=dev; \
    fi

# Copy project files
COPY clean/ clean/
COPY public/ public/
COPY scripts/ scripts/
COPY opencode.json start-proxy.cmd start-ui.cmd usage.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]