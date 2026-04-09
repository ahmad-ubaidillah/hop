import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export interface TestHistory {
  id: string;
  timestamp: string;
  feature: string;
  scenario: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface CloudReporterConfig {
  enabled: boolean;
  historyDir?: string;
  slack?: SlackConfig;
  teams?: TeamsConfig;
  webhookUrl?: string;
}

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface TeamsConfig {
  webhookUrl: string;
}

export interface NotificationPayload {
  title: string;
  text: string;
  color: string;
  fields: { title: string; value: string; short?: boolean }[];
  footer?: string;
  timestamp?: string;
}

export class CloudReporter {
  private config: CloudReporterConfig;
  private history: TestHistory[] = [];

  constructor(config: CloudReporterConfig) {
    this.config = {
      enabled: false,
      historyDir: './reports/history',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) return;
    
    const historyDir = this.config.historyDir || './reports/history';
    if (!existsSync(historyDir)) {
      await mkdir(historyDir, { recursive: true });
    }
    
    await this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    try {
      const historyPath = join(this.config.historyDir || './reports/history', 'test-history.json');
      if (existsSync(historyPath)) {
        const data = await readFile(historyPath, 'utf-8');
        this.history = JSON.parse(data);
      }
    } catch {
      this.history = [];
    }
  }

  async saveHistory(): Promise<void> {
    const historyPath = join(this.config.historyDir || './reports/history', 'test-history.json');
    await writeFile(historyPath, JSON.stringify(this.history, null, 2));
  }

  addTestResult(
    feature: string,
    scenario: string,
    status: 'passed' | 'failed' | 'skipped',
    duration: number,
    error?: string
  ): void {
    this.history.push({
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      feature,
      scenario,
      status,
      duration,
      error,
    });

    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
  }

  getHistory(limit = 50): TestHistory[] {
    return this.history.slice(-limit);
  }

  getFlakyTests(threshold = 0.3): { scenario: string; failureRate: number; runs: number }[] {
    const testCounts = new Map<string, { passed: number; failed: number; total: number }>();

    for (const test of this.history) {
      const key = `${test.feature}:${test.scenario}`;
      const current = testCounts.get(key) || { passed: 0, failed: 0, total: 0 };
      
      current.total++;
      if (test.status === 'passed') current.passed++;
      if (test.status === 'failed') current.failed++;
      
      testCounts.set(key, current);
    }

    const flaky: { scenario: string; failureRate: number; runs: number }[] = [];
    
    for (const [scenario, counts] of testCounts) {
      if (counts.total >= 3) {
        const failureRate = counts.failed / counts.total;
        if (failureRate >= threshold) {
          flaky.push({ scenario, failureRate, runs: counts.total });
        }
      }
    }

    return flaky.sort((a, b) => b.failureRate - a.failureRate);
  }

  getTrends(days = 7): { date: string; passed: number; failed: number; total: number }[] {
    const trends = new Map<string, { passed: number; failed: number }>();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    for (const test of this.history) {
      if (new Date(test.timestamp).getTime() < cutoff) continue;
      
      const date = test.timestamp.split('T')[0];
      const current = trends.get(date) || { passed: 0, failed: 0 };
      
      if (test.status === 'passed') current.passed++;
      if (test.status === 'failed') current.failed++;
      
      trends.set(date, current);
    }

    return Array.from(trends.entries())
      .map(([date, counts]) => ({
        date,
        ...counts,
        total: counts.passed + counts.failed,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async sendNotification(
    title: string,
    text: string,
    status: 'passed' | 'failed' | 'skipped'
  ): Promise<void> {
    const color = status === 'passed' ? '#10b981' : status === 'failed' ? '#ef4444' : '#f59e0b';
    
    if (this.config.slack?.webhookUrl) {
      await this.sendSlackNotification({ title, text, color, fields: [], footer: 'Hop Framework' });
    }

    if (this.config.teams?.webhookUrl) {
      await this.sendTeamsNotification({ title, text, color, fields: [], footer: 'Hop Framework' });
    }

    if (this.config.webhookUrl) {
      await this.sendGenericWebhook({ title, text, color, fields: [] });
    }
  }

  private async sendSlackNotification(payload: NotificationPayload): Promise<void> {
    const slackPayload = {
      attachments: [
        {
          color: payload.color,
          title: payload.title,
          text: payload.text,
          fields: payload.fields,
          footer: payload.footer,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await fetch(this.config.slack!.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });
  }

  private async sendTeamsNotification(payload: NotificationPayload): Promise<void> {
    const teamsPayload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: payload.color.replace('#', ''),
      summary: payload.title,
      sections: [
        {
          activityTitle: payload.title,
          activitySubtitle: payload.text,
          facts: payload.fields.map(f => ({ name: f.title, value: f.value })),
        },
      ],
    };

    await fetch(this.config.teams!.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsPayload),
    });
  }

  private async sendGenericWebhook(payload: NotificationPayload): Promise<void> {
    await fetch(this.config.webhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async notifyTestComplete(
    total: number,
    passed: number,
    failed: number,
    duration: number
  ): Promise<void> {
    const status = failed > 0 ? 'failed' : 'passed';
    const title = `Test Run ${status === 'passed' ? '✅' : '❌'}`;
    const text = `${passed}/${total} passed, ${failed} failed in ${(duration / 1000).toFixed(1)}s`;

    await this.sendNotification(title, text, status);
  }

  async notifyFlakyTests(): Promise<void> {
    const flaky = this.getFlakyTests();
    if (flaky.length === 0) return;

    const title = '⚠️ Flaky Tests Detected';
    const text = flaky.map(t => `${t.scenario}: ${Math.round(t.failureRate * 100)}% failure rate`).join('\n');

    await this.sendNotification(title, text, 'failed');
  }
}

export function createCloudReporter(config: CloudReporterConfig): CloudReporter {
  return new CloudReporter(config);
}