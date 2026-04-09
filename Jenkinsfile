pipeline {
    agent {
        docker {
            image 'oven/bun:latest'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    environment {
        HOP_FEATURES = './features'
        HOP_STEPS = './steps'
        HOP_REPORTS = './reports'
        HOP_ENV = 'ci'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    stages {
        stage('Install Dependencies') {
            steps {
                sh 'bun install'
                sh 'bun add -i playwright && npx playwright install chromium --with-deps || true'
            }
        }
        
        stage('Lint & Type Check') {
            steps {
                sh 'bun run prepare'
            }
        }
        
        stage('API Tests') {
            parallel {
                stage('Smoke Tests') {
                    steps {
                        sh 'bun run bin/cli.ts test --tags "@smoke" --format json,junit'
                    }
                }
                stage('Regression Tests') {
                    steps {
                        sh 'bun run bin/cli.ts test --tags "@regression" --parallel --concurrency 4 --format json,junit'
                    }
                }
            }
        }
        
        stage('UI Tests') {
            steps {
                sh 'bun run bin/cli.ts test --features ./features/ui --video on-failure --format html'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/screenshots/**,reports/videos/**', allowEmptyArchive: true
                }
                failure {
                    echo 'UI Test failed! Check screenshots.'
                }
            }
        }
        
        stage('Load Tests') {
            steps {
                sh 'bun run bin/cli.ts gen-k6 --output load-test.js'
                sh 'k6 run --vus 10 --duration 30s load-test.js'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'results.json', allowEmptyArchive: true
                }
            }
        }
    }
    
    post {
        always {
            junit 'reports/*.xml'
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports',
                reportFiles: 'index.html',
                reportName: 'Hop Test Report'
            ])
            
            echo "Test Summary:"
            sh 'ls -la reports/'
        }
        
        success {
            echo 'All tests passed!'
            emailext (
                subject: "SUCCESS: Hop Tests - ${env.JOB_NAME}",
                body: "All tests passed. View results: ${env.BUILD_URL}",
                to: '${env.NOTIFICATION_EMAIL}'
            )
        }
        
        failure {
            echo 'Some tests failed!'
            emailext (
                subject: "FAILURE: Hop Tests - ${env.JOB_NAME}",
                body: "Tests failed. View results: ${env.BUILD_URL}",
                to: '${env.NOTIFICATION_EMAIL}'
            )
        }
    }
}