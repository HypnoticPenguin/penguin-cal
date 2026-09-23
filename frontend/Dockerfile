# Stage 1: Build static assets
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
# Copy built frontend assets
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration to reverse-proxy /api calls to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]