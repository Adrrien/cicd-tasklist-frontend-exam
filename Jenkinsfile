pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = "adrrien/tasklist-frontend-exam"
        DOCKER_CREDENTIALS_ID = "dockerhub-credential"
        SONAR_PROJECT_KEY = "tasklist-frontend-exam"
        BUILD_TAG = "${env.BUILD_NUMBER}"
        IMAGE_TAG = "${DOCKER_IMAGE_NAME}:${BUILD_TAG}"
        IMAGE_LATEST = "${DOCKER_IMAGE_NAME}:latest"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out repository..."
                    checkout scm
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo "Installing dependencies..."
                    sh 'npm ci --include=dev'
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    echo "Building React/Vite project..."
                    sh 'npm run build'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    echo "Running unit tests with coverage..."
                    sh 'npm run test:coverage'
                }
            }
            post {
                always {
                    junit testResults: 'reports/junit.xml',
                          skipPublishingChecks: true,
                          allowEmptyResults: true
                    archiveArtifacts artifacts: 'coverage/**',
                                      allowEmptyArchive: true
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    echo "Running SonarQube analysis..."
                    withSonarQubeEnv('sonarqube-server-1') {
                        sh '''
                            npx sonarqube-scanner \
                              -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                              -Dsonar.sources=src \
                              -Dsonar.tests=src \
                              -Dsonar.test.inclusions=src/__tests__/**/*.test.tsx,src/__tests__/**/*.test.ts \
                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                              -Dsonar.sourceEncoding=UTF-8
                        '''
                    }
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                script {
                    echo "Checking SonarQube Quality Gate..."
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: false
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image..."
                    sh """
                        docker build \
                          -t ${IMAGE_TAG} \
                          -t ${IMAGE_LATEST} \
                          -f Dockerfile \
                          .
                    """
                }
            }
        }

        stage('Scan with Trivy') {
            steps {
                script {
                    echo "Scanning Docker image with Trivy..."
                    sh """
                        trivy image \
                          --format json \
                          --output trivy-report.json \
                          --severity HIGH,CRITICAL \
                          ${IMAGE_TAG} || true

                        trivy image \
                          --format spdx-json \
                          --output sbom-spdx.json \
                          ${IMAGE_TAG} || true

                        trivy image \
                          --format table \
                          --severity HIGH,CRITICAL \
                          ${IMAGE_TAG} || true
                    """
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.json,sbom-spdx.json',
                                      allowEmptyArchive: true
                }
            }
        }

        stage('Publish to Docker Hub') {
            when {
                anyOf {
                    branch 'main'
                    expression { env.GIT_BRANCH == 'origin/main' }
                }
            }
            steps {
                script {
                    echo "Publishing Docker image to Docker Hub..."
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID,
                                                     usernameVariable: 'DOCKER_USERNAME',
                                                     passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh """
                            echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
                            docker push ${IMAGE_TAG}
                            docker push ${IMAGE_LATEST}
                            docker logout
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Cleaning up workspace..."
                cleanWs()
            }
        }
        success {
            echo "Pipeline completed successfully!"
        }
        failure {
            echo "Pipeline failed!"
        }
    }
}
