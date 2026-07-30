FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies and ignore pnpm minimum release age check
RUN if [ -f pnpm-lock.yaml ]; then \
        npm install -g pnpm && pnpm config set ignore-dep-scripts true && pnpm install --frozen-lockfile --prod --config.ignore-compatibility-db=true --config.minimum-release-age=0; \
    elif [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm install --omit=dev; \
    fi

# Copy project files
COPY clean/ clean/
COPY public/ public/
COPY scripts/ scripts/
COPY opencode.json start-proxy.cmd start-ui.cmd ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]