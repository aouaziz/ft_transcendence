# Frontend Dockerfile
FROM ubuntu:latest

# Install nginx and OpenSSL
RUN apt-get update && apt-get install -y nginx openssl

# Create directories for SSL certificates
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=MO/ST=RHAMNA/L=BENGRIR/O=1337/OU=1337/CN=localhost"

# Setup nginx user and required directories
RUN useradd -r nginx && \
    mkdir -p /var/log/nginx && \
    mkdir -p /var/run && \
    chown -R nginx:nginx /var/log/nginx /var/run

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443 3000

CMD ["nginx", "-g", "daemon off;"]