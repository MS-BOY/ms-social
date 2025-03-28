#!/bin/bash

# Docker script helper for the Social Media Platform

case "$1" in
  "build")
    echo "Building Docker image..."
    docker build -t social-media-platform .
    ;;
    
  "run")
    echo "Running Docker container..."
    docker run -p 5000:5000 --env-file .env social-media-platform
    ;;
    
  "compose-up")
    echo "Starting services with Docker Compose..."
    docker-compose up
    ;;
    
  "compose-down")
    echo "Stopping services with Docker Compose..."
    docker-compose down
    ;;
    
  "prune")
    echo "Cleaning up Docker resources..."
    docker system prune -f
    ;;
    
  *)
    echo "Usage: ./docker-scripts.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  build        - Build the Docker image"
    echo "  run          - Run the Docker container"
    echo "  compose-up   - Start services with Docker Compose"
    echo "  compose-down - Stop services with Docker Compose"
    echo "  prune        - Clean up Docker resources"
    ;;
esac