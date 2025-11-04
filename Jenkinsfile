pipeline {
    agent any
    
    environment{
        IMAGE_NAME = "jenkins-demo"
        CONTAINER_NAME = "Jenkins-demo-container"
    }

    stages {
        stage('Clone the repository') {
            steps {
                sh 'rm -rf *'
                sh 'git clone https://github.com/sethu-byte/OneDataAssestment.git'
            }
        }
        stage('Building the Docker IMage'){
            steps {
                dir('OneDataAssestment'){
                    sh "docker build -t ${IMAGE_NAME}:latest ."
                }
            }
        }
        stage('Run Docker Image'){
            steps {
                sh "docker rm -f ${CONTAINER_NAME} || true"
                sh 'docker run -d --name ${CONTAINER_NAME} --network jenkins-net -p 8081:3000 ${IMAGE_NAME}:latest'
                sh 'docker ps'
                sh 'docker logs ${CONTAINER_NAME}'
            }
        }
    }
}
