# Use the official Node.js image as the base image
FROM node:18

# Create and set the working directory for the NestJS application
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the NestJS application code
COPY . .

# Build the NestJS application
RUN npm run build

# Install Python and dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv

# Create a virtual environment for Python
RUN python3 -m venv /app/venv

# Activate the virtual environment and install dependencies
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Ensure Python scripts are executable
RUN chmod +x scripts/*.py

# Expose the NestJS application port
EXPOSE 3000

# Command to start the NestJS application
CMD ["npm", "run", "start:dev"]
