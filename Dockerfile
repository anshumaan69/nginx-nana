FROM node:latest

WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port 3000
EXPOSE 3000

# Run the server
CMD [ "node", "server.js" ]
