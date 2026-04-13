import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
export class CloudReporter {
    config;
    history = [];
    constructor(config) {
        this.config = {
            enabled: false,
            historyDir: './reports/history',
            ...config,
        };
    }
    async initialize() {
        if (!this.config.enabled)
            return;
        const historyDir = this.config.historyDir || './reports/history';
        if (!existsSync(historyDir)) {
            await mkdir(historyDir, { recursive: true });
        }
        await this.loadHistory();
    }
    async loadHistory() {
        try {
            const historyPath = join(this.config.historyDir || './reports/history', 'test-history.json');
            if (existsSync(historyPath)) {
                const data = await readFile(historyPath, 'utf-8');
                this.history = JSON.parse(data);
            }
        }
        catch {
            this.history = [];
        }
    }
    async saveHistory() {
        const historyPath = join(this.config.historyDir || './reports/history', 'test-history.json');
        await writeFile(historyPath, JSON.stringify(this.history, null, 2));
    }
    addTestResult(feature, scenario, status, duration, error) {
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
    getHistory(limit = 50) {
        return this.history.slice(-limit);
    }
    getFlakyTests(threshold = 0.3) {
        const testCounts = new Map();
        for (const test of this.history) {
            const key = `${test.feature}:${test.scenario}`;
            const current = testCounts.get(key) || { passed: 0, failed: 0, total: 0 };
            current.total++;
            if (test.status === 'passed')
                current.passed++;
            if (test.status === 'failed')
                current.failed++;
            testCounts.set(key, current);
        }
        const flaky = [];
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
    getTrends(days = 7) {
        const trends = new Map();
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        for (const test of this.history) {
            if (new Date(test.timestamp).getTime() < cutoff)
                continue;
            const date = test.timestamp.split('T')[0];
            const current = trends.get(date) || { passed: 0, failed: 0 };
            if (test.status === 'passed')
                current.passed++;
            if (test.status === 'failed')
                current.failed++;
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
    async sendNotification(title, text, status) {
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
    async sendSlackNotification(payload) {
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
        await fetch(this.config.slack.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackPayload),
        });
    }
    async sendTeamsNotification(payload) {
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
        await fetch(this.config.teams.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamsPayload),
        });
    }
    async sendGenericWebhook(payload) {
        await fetch(this.config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    }
    async notifyTestComplete(total, passed, failed, duration) {
        const status = failed > 0 ? 'failed' : 'passed';
        const title = `Test Run ${status === 'passed' ? '✅' : '❌'}`;
        const text = `${passed}/${total} passed, ${failed} failed in ${(duration / 1000).toFixed(1)}s`;
        await this.sendNotification(title, text, status);
    }
    async notifyFlakyTests() {
        const flaky = this.getFlakyTests();
        if (flaky.length === 0)
            return;
        const title = '⚠️ Flaky Tests Detected';
        const text = flaky.map(t => `${t.scenario}: ${Math.round(t.failureRate * 100)}% failure rate`).join('\n');
        await this.sendNotification(title, text, 'failed');
    }
}
export function createCloudReporter(config) {
    return new CloudReporter(config);
}
