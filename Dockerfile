# Use Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies for root, backend, and frontend
RUN npm install
RUN npm install --prefix backend
RUN npm install --prefix frontend

# Build the React frontend
RUN npm run build --prefix frontend

# Hugging Face Spaces require exposing and listening on port 7860
EXPOSE 7860
ENV PORT=7860

# Start the unified backend server
CMD ["node", "backend/server.js"]
