import { MockEngine } from './mock-engine.js';
export class MockServer {
    engine;
    port;
    featurePath;
    verbose;
    constructor(featurePath, port = 8080, verbose = false) {
        this.engine = new MockEngine(verbose);
        this.port = port;
        this.featurePath = featurePath;
        this.verbose = verbose;
    }
    async start() {
        await this.engine.loadFeature(this.featurePath);
        const server = Bun.serve({
            port: this.port,
            fetch: async (req) => {
                if (this.verbose) {
                    console.log(`📡 Incoming request: ${req.method} ${req.url}`);
                }
                const url = new URL(req.url);
                // Parse body
                let body;
                try {
                    const contentType = req.headers.get('content-type');
                    if (contentType?.includes('application/json')) {
                        body = await req.json();
                    }
                    else {
                        const text = await req.text();
                        try {
                            body = JSON.parse(text);
                        }
                        catch {
                            body = text;
                        }
                    }
                }
                catch (e) {
                    body = undefined;
                }
                const mockReq = {
                    path: url.pathname,
                    method: req.method,
                    headers: Object.fromEntries(req.headers),
                    queryParams: Object.fromEntries(url.searchParams.entries()),
                    body,
                };
                const res = await this.engine.handleRequest(mockReq);
                return new Response(typeof res.body === 'object' ? JSON.stringify(res.body, null, 2) : String(res.body || ''), {
                    status: res.status,
                    headers: res.headers,
                });
            },
            error: (error) => {
                return new Response(`Error: ${error.message}`, { status: 500 });
            }
        });
        console.log(`\n═══════════════════════════════════════════════════`);
        console.log(`🚀 Hop Mock Server is running!`);
        console.log(`🔗 URL: http://localhost:${server.port}`);
        console.log(`📖 Feature: ${this.featurePath}`);
        console.log(`═══════════════════════════════════════════════════\n`);
        return server;
    }
}
