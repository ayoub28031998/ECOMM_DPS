# Step 1: Build Stage
FROM node:18 AS build-stage

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install -g @angular/cli

# Copie du code source
COPY . .

# Build de l'application Angular
RUN ng build --configuration=production --output-hashing=all

FROM nginx:alpine AS runtime-stage

# Set the working directory for Nginx
WORKDIR /usr/share/nginx/html

# Copy the built Angular application from the build stage
COPY --from=build-stage /app/dist/ecomm_office_land/browser .

# Copy the environment script
COPY ./set-env.sh ./set-env.sh
RUN chmod +x ./set-env.sh

# Inject runtime environment variables before starting Nginx
CMD ["/bin/sh", "-c", "./set-env.sh && nginx -g 'daemon off;'"]

# Expose port 80 for the web server
EXPOSE 80