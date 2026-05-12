FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Clean up default node_modules to avoid permission issues
RUN rm -rf /home/pptruser/app/node_modules

# Set working directory
WORKDIR /home/pptruser/app

# Copy package files
COPY package*.json ./

# Change ownership of the app directory to pptruser BEFORE installing
RUN chown -R pptruser:pptruser /home/pptruser/app

# Switch back to non-root user
USER pptruser

# Installer proprement en tant que pptruser pour que le cache aille dans /home/pptruser/.cache/puppeteer
RUN npm install
RUN PUPPETEER_SKIP_DOWNLOAD=false npx puppeteer browsers install chrome

# Copy application files with proper ownership
COPY --chown=pptruser:pptruser . .

# Expose a port
EXPOSE 3000

# Start command
CMD ["npm", "start"]