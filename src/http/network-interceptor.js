export class NetworkInterceptor {
    mocks = [];
    calls = [];
    blockedPatterns = [];
    page = null;
    setPage(page) {
        this.page = page;
        this.setupPageInterception();
    }
    setupPageInterception() {
        if (!this.page)
            return;
        this.page.on('request', (request) => {
            const url = request.url();
            const startTime = Date.now();
            const call = {
                url,
                method: request.method(),
                requestHeaders: request.headers(),
                postData: request.postData() || undefined,
            };
            const matchingMock = this.mocks.find((m) => this.matchUrl(url, m.urlPattern));
            if (matchingMock) {
                const delay = matchingMock.delay || 0;
                setTimeout(() => {
                    this.page?.route(url, (route) => {
                        route.fulfill({
                            status: matchingMock.status || 200,
                            body: typeof matchingMock.body === 'string'
                                ? matchingMock.body
                                : JSON.stringify(matchingMock.body),
                            headers: matchingMock.headers,
                        });
                    });
                }, delay);
            }
            const isBlocked = this.blockedPatterns.some((pattern) => this.matchUrl(url, pattern));
            if (isBlocked) {
                this.page?.route(url, (route) => route.abort('blocked'));
            }
            request.on('response', (response) => {
                call.status = response.status();
                call.responseHeaders = response.headers();
                call.endTime = Date.now();
                call.timing = { startTime, endTime: Date.now(), duration: Date.now() - startTime };
                response.text().then((body) => {
                    try {
                        call.responseBody = JSON.parse(body);
                    }
                    catch {
                        call.responseBody = body;
                    }
                });
            });
            this.calls.push(call);
        });
    }
    matchUrl(url, pattern) {
        if (pattern === '*')
            return true;
        if (pattern.startsWith('http'))
            return url.includes(pattern);
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
    }
    addMock(mock) {
        this.mocks.push(mock);
        console.log(`🎭 Added network mock: ${mock.urlPattern}`);
    }
    removeMock(urlPattern) {
        this.mocks = this.mocks.filter((m) => m.urlPattern !== urlPattern);
    }
    clearMocks() {
        this.mocks = [];
    }
    blockUrl(pattern) {
        this.blockedPatterns.push(pattern);
        console.log(`🚫 Blocked: ${pattern}`);
    }
    unblockUrl(pattern) {
        this.blockedPatterns = this.blockedPatterns.filter((p) => p !== pattern);
    }
    clearBlocks() {
        this.blockedPatterns = [];
    }
    getCalls() {
        return this.calls;
    }
    clearCalls() {
        this.calls = [];
    }
    getCallByUrl(url) {
        return this.calls.find((c) => c.url.includes(url));
    }
    getCallsByMethod(method) {
        return this.calls.filter((c) => c.method.toUpperCase() === method.toUpperCase());
    }
    getFailedCalls() {
        return this.calls.filter((c) => !c.status || c.status >= 400);
    }
    printSummary() {
        console.log('\n📊 Network Interception Summary:');
        console.log(`   Total calls: ${this.calls.length}`);
        console.log(`   GET: ${this.getCallsByMethod('GET').length}`);
        console.log(`   POST: ${this.getCallsByMethod('POST').length}`);
        console.log(`   Failed: ${this.getFailedCalls().length}`);
        console.log(`   Mocks active: ${this.mocks.length}`);
        console.log(`   Blocked patterns: ${this.blockedPatterns.length}`);
    }
}
export function createNetworkInterceptor() {
    return new NetworkInterceptor();
}
