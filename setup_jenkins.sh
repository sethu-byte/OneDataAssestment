#!/bin/bash
# ==========================================
# Jenkins + Docker Setup Script
# Author: K Sethu
# Description: This script installs Docker, runs Jenkins in Docker, 
#              configures permissions, and sets up networking for container builds.
# ==========================================

# Step 1: Update and install dependencies
echo "[INFO] Updating packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Step 2: Install Docker Engine
echo "[INFO] Installing Docker..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Step 3: Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Step 4: Add Jenkins user to Docker group for socket access
echo "[INFO] Adding Jenkins user to Docker group..."
sudo usermod -aG docker jenkins || true

# Step 5: Create a Docker network for Jenkins and app containers
echo "[INFO] Creating Docker network: jenkins-net..."
docker network create jenkins-net || true

# Step 6: Run Jenkins container with Docker socket mounted
echo "[INFO] Running Jenkins container..."
docker run -d \
  --name jenkins \
  --network jenkins-net \
  -p 8080:8080 -p 50000:50000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts

echo "[SUCCESS] Jenkins container started successfully!"
echo "Access Jenkins at: http://localhost:8080"

# Step 7: Display initial admin password
echo "[INFO] Jenkins initial admin password:"
sleep 5
docker exec -it jenkins cat /var/jenkins_home/secrets/initialAdminPassword || true
