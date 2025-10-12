
# Use a lightweight Node.js image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the SvelteKit application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3000

# Set the entrypoint to start the Node.js server
CMD [ "node", "build/index.js" ]
