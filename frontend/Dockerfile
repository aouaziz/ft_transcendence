# Use the official Nginx image as the base
FROM nginx:latest

# Copy your frontend files to the Nginx default directory
COPY . /usr/share/nginx/html

# Expose the Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]