FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Clean up default node_modules to avoid permission issues
RUN rm -rf /home/pptruser/app/node_modules

# Set working directory
WORKDIR /home/pptruser/app

# Copy package files
COPY package*.json ./

# Installer proprement en tant que root, puis forcer l'installation de Chromium
RUN npm install
RUN PUPPETEER_SKIP_DOWNLOAD=false npx puppeteer browsers install chrome

# Copy application files
COPY . .

# Change ownership of the app directory to pptruser
RUN chown -R pptruser:pptruser /home/pptruser/app

# Switch back to non-root user
USER pptruser

# Variable environnement pour forcer PUPPETEER à utiliser le Chrome du système docker
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Expose a port
EXPOSE 3000

# Start command
CMD ["npm", "start"]