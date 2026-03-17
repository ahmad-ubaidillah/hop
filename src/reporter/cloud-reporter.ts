/**
 * Cloud Reporting Support
 * Uploads test reports to cloud storage and generates shareable links
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface CloudReporterConfig {
  provider: 's3' | 'gcs' | 'azure' | 'custom';
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  endpoint?: string;
  customUploader?: (reportPath: string, metadata: ReportMetadata) => Promise<string>;
}

export interface ReportMetadata {
  projectName: string;
  environment: string;
  branch: string;
  commit: string;
  timestamp: string;
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

export interface TestResult {
  feature: string;
  scenario: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export class CloudReporter {
  private config: CloudReporterConfig;
  private results: TestResult[] = [];

  constructor(config: CloudReporterConfig) {
    this.config = config;
  }

  /**
   * Add test result
   */
  addResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Generate report metadata
   */
  generateMetadata(projectName: string): ReportMetadata {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const duration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      projectName,
      environment: process.env.TEST_ENV || 'development',
      branch: process.env.GIT_BRANCH || 'unknown',
      commit: process.env.GIT_COMMIT || 'unknown',
      timestamp: new Date().toISOString(),
      duration,
      passed,
      failed,
      skipped,
      total: this.results.length
    };
  }

  /**
   * Upload report to cloud storage
   */
  async uploadReport(reportPath: string, metadata: ReportMetadata): Promise<string> {
    const reportContent = readFileSync(reportPath);
    const fileName = `reports/${metadata.projectName}/${metadata.timestamp}/${reportPath}`;

    if (this.config.customUploader) {
      return this.config.customUploader(reportPath, metadata);
    }

    switch (this.config.provider) {
      case 's3':
        return this.uploadToS3(reportContent, fileName, metadata);
      case 'gcs':
        return this.uploadToGCS(reportContent, fileName, metadata);
      case 'azure':
        return this.uploadToAzure(reportContent, fileName, metadata);
      default:
        throw new Error(`Unknown cloud provider: ${this.config.provider}`);
    }
  }

  private async uploadToS3(
    content: Buffer,
    fileName: string,
    metadata: ReportMetadata
  ): Promise<string> {
    // S3 upload implementation
    const bucket = this.config.bucket || process.env.AWS_BUCKET;
    const region = this.config.region || process.env.AWS_REGION;
    
    console.log(`Uploading to S3: ${bucket}/${fileName}`);
    
    // In production, use @aws-sdk/client-s3
    // const s3Client = new S3Client({ region });
    // await s3Client.send(new PutObjectCommand({
    //   Bucket: bucket,
    //   Key: fileName,
    //   Body: content
    // }));

    return `https://${bucket}.s3.${region}.amazonaws.com/${fileName}`;
  }

  private async uploadToGCS(
    content: Buffer,
    fileName: string,
    metadata: ReportMetadata
  ): Promise<string> {
    const bucket = this.config.bucket || process.env.GCS_BUCKET;
    
    console.log(`Uploading to GCS: ${bucket}/${fileName}`);
    
    // In production, use @google-cloud/storage
    // const storage = new Storage();
    // await storage.bucket(bucket).file(fileName).save(content);

    return `https://storage.googleapis.com/${bucket}/${fileName}`;
  }

  private async uploadToAzure(
    content: Buffer,
    fileName: string,
    metadata: ReportMetadata
  ): Promise<string> {
    const container = this.config.bucket || process.env.AZURE_CONTAINER;
    
    console.log(`Uploading to Azure: ${container}/${fileName}`);
    
    // In production, use @azure/storage-blob
    // const blobServiceClient = new BlobServiceClient(connectionString);
    // const containerClient = blobServiceClient.getContainerClient(container);
    // await containerClient.getBlockBlobClient(fileName).upload(content);

    return `https://${process.env.AZURE_ACCOUNT}.blob.core.windows.net/${container}/${fileName}`;
  }

  /**
   * Generate shareable HTML report
   */
  generateShareableReport(metadata: ReportMetadata): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report - ${metadata.projectName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { display: flex; gap: 20px; margin-bottom: 20px; }
    .stat { padding: 15px; border-radius: 5px; text-align: center; }
    .passed { background: #d4edda; }
    .failed { background: #f8d7da; }
    .skipped { background: #fff3cd; }
    .total { background: #d1ecf1; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Test Report</h1>
  <div class="summary">
    <div class="stat passed"><strong>${metadata.passed}</strong><br>Passed</div>
    <div class="stat failed"><strong>${metadata.failed}</strong><br>Failed</div>
    <div class="stat skipped"><strong>${metadata.skipped}</strong><br>Skipped</div>
    <div class="stat total"><strong>${metadata.total}</strong><br>Total</div>
  </div>
  <h2>Details</h2>
  <p>Project: ${metadata.projectName}</p>
  <p>Environment: ${metadata.environment}</p>
  <p>Branch: ${metadata.branch}</p>
  <p>Commit: ${metadata.commit}</p>
  <p>Duration: ${(metadata.duration / 1000).toFixed(2)}s</p>
  <p>Timestamp: ${metadata.timestamp}</p>
</body>
</html>`;

    return html;
  }

  /**
   * Generate dashboard link
   */
  async generateDashboardLink(metadata: ReportMetadata): Promise<string> {
    const baseUrl = process.env.DASHBOARD_URL || 'https://dashboard.hop-framework.io';
    const reportId = `${metadata.projectName}-${Date.now()}`;
    
    // In production, save to database and return real link
    return `${baseUrl}/reports/${reportId}`;
  }
}

/**
 * Trend analysis across runs
 */
export class TrendAnalyzer {
  private historicalData: ReportMetadata[] = [];

  /**
   * Add historical data point
   */
  addDataPoint(metadata: ReportMetadata): void {
    this.historicalData.push(metadata);
  }

  /**
   * Analyze trends
   */
  analyzeTrends(): TrendAnalysis {
    if (this.historicalData.length < 2) {
      return {
        trend: 'insufficient_data',
        changePercent: 0,
        recommendation: 'Need more data points for trend analysis'
      };
    }

    const recent = this.historicalData.slice(-10);
    const previous = this.historicalData.slice(-20, -10);
    
    const recentPassRate = this.calculatePassRate(recent);
    const previousPassRate = this.calculatePassRate(previous);
    
    const changePercent = ((recentPassRate - previousPassRate) / previousPassRate) * 100;
    
    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    let recommendation = 'Test pass rate is stable';
    
    if (changePercent > 5) {
      trend = 'improving';
      recommendation = 'Test pass rate is improving!';
    } else if (changePercent < -5) {
      trend = 'degrading';
      recommendation = 'WARNING: Test pass rate is declining';
    }

    return {
      trend,
      changePercent,
      recommendation,
      recentPassRate,
      previousPassRate,
      totalRuns: this.historicalData.length
    };
  }

  private calculatePassRate(data: ReportMetadata[]): number {
    const total = data.reduce((sum, d) => sum + d.total, 0);
    const passed = data.reduce((sum, d) => sum + d.passed, 0);
    return total > 0 ? (passed / total) * 100 : 0;
  }
}

export interface TrendAnalysis {
  trend: 'improving' | 'degrading' | 'stable' | 'insufficient_data';
  changePercent: number;
  recommendation: string;
  recentPassRate?: number;
  previousPassRate?: number;
  totalRuns?: number;
}
