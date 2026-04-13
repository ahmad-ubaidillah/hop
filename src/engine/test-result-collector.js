export class TestResultCollector {
    results = [];
    add(result) {
        this.results.push(result);
    }
    getResults() {
        return this.results;
    }
    getPassed() {
        return this.results.filter(r => r.status === 'passed');
    }
    getFailed() {
        return this.results.filter(r => r.status === 'failed');
    }
    getSkipped() {
        return this.results.filter(r => r.status === 'skipped');
    }
    getTotalDuration() {
        return this.results.reduce((sum, r) => sum + r.duration, 0);
    }
    getSummary() {
        return {
            total: this.results.length,
            passed: this.getPassed().length,
            failed: this.getFailed().length,
            skipped: this.getSkipped().length,
            duration: this.getTotalDuration(),
        };
    }
    getFailedTests() {
        return this.getFailed().map(r => ({
            feature: r.featureName,
            scenario: r.scenarioName,
            step: r.steps.find(s => s.status === 'failed'),
            error: r.error,
        }));
    }
    clear() {
        this.results = [];
    }
    toJSON() {
        return JSON.stringify({
            summary: this.getSummary(),
            results: this.results,
        }, null, 2);
    }
    toJUnitXML() {
        const failures = this.getFailed();
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<testsuite name="hop" tests="' + this.results.length + '" failures="' + failures.length + '" time="' + (this.getTotalDuration() / 1000) + '">\n';
        for (const result of this.results) {
            xml += '  <testcase name="' + this.escapeXml(result.scenarioName) + '" classname="' + this.escapeXml(result.featureName) + '" time="' + (result.duration / 1000) + '">\n';
            if (result.status === 'failed') {
                xml += '    <failure message="' + this.escapeXml(result.error || 'Test failed') + '">\n';
                xml += this.escapeXml(result.error || '') + '\n';
                xml += '    </failure>\n';
            }
            xml += '  </testcase>\n';
        }
        xml += '</testsuite>';
        return xml;
    }
    escapeXml(str) {
        return str
            .replace(/&/g, '&amp')
            .replace(/</g, '&lt')
            .replace(/>/g, '&gt')
            .replace(/"/g, '&quot')
            .replace(/'/g, '&apos');
    }
}
