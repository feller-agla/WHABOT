FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Clean up default node_modules to avoid permission issues
RUN rm -rf /home/pptruser/app/node_modules

# Set working directory
WORKDIR /home/pptruser/app

# Copy package files
COPY package*.json ./

# Install dependencies as root to avoid permission errors
RUN npm install

# Copy application files
COPY . .

# Change ownership of the app directory to pptruser
RUN chown -R pptruser:pptruser /home/pptruser/app

# Switch back to non-root user
USER pptruser

# Expose a port (Render requires this to know the app is running in a Web Service)
EXPOSE 3000

# Start command
CMD ["npm", "start"]