import { RetryManager } from './retry-manager.js';
import { InterceptorManager } from './interceptor-manager.js';
export class HttpClient {
    timeout;
    verbose;
    retryManager;
    interceptorManager;
    defaultRetry;
    logger;
    constructor(options = {}) {
        this.timeout = options.timeout || 30000;
        this.verbose = options.verbose || false;
        this.defaultRetry = options.retry;
        this.logger = options.logger || console;
        this.retryManager = new RetryManager();
        this.interceptorManager = new InterceptorManager();
    }
    addInterceptor(interceptor) {
        this.interceptorManager.add(interceptor);
    }
    removeInterceptor(interceptor) {
        this.interceptorManager.remove(interceptor);
    }
    setDefaultRetry(retry) {
        this.defaultRetry = retry;
    }
    toFormUrlEncoded(data) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, String(v)));
            }
            else {
                params.append(key, String(value));
            }
        }
        return params.toString();
    }
    toFormData(data) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Blob || value instanceof File) {
                formData.append(key, value);
            }
            else if (Array.isArray(value)) {
                value.forEach(v => formData.append(key, String(v)));
            }
            else {
                formData.append(key, String(value));
            }
        }
        return formData;
    }
    async request(options) {
        const retryOptions = options.retry || this.defaultRetry;
        if (!retryOptions)
            return this.executeRequestWithInterceptors(options);
        return this.retryManager.execute(async (attempt) => {
            const result = await this.executeRequestWithInterceptors(options);
            if (retryOptions.retriesOnStatus?.includes(result.status)) {
                throw new Error(`Retryable status: ${result.status}`);
            }
            return result;
        }, retryOptions, this.isRetryableError);
    }
    async executeRequestWithInterceptors(options) {
        try {
            const processedOptions = await this.interceptorManager.runRequestInterceptors(options);
            const result = await this.executeActualRequest(processedOptions);
            return await this.interceptorManager.runResponseInterceptors(result, processedOptions);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            throw await this.interceptorManager.runErrorInterceptors(err, options);
        }
    }
    isRetryableError(error) {
        const msg = error.message.toLowerCase();
        return ['network', 'timeout', 'econnreset', 'econnrefused', 'socket'].some(term => msg.includes(term));
    }
    async executeActualRequest(options) {
        const { method, url, headers = {}, body, verbose, formData } = options;
        const isVerbose = verbose || this.verbose;
        const requestHeaders = { ...headers };
        if ((body || formData) && !requestHeaders['Content-Type']) {
            if (requestHeaders['Content-Type'] === 'application/x-www-form-urlencoded') {
                // Keep it
            }
            else if (requestHeaders['Content-Type']?.includes('multipart/form-data')) {
                delete requestHeaders['Content-Type'];
            }
            else if (typeof body === 'object') {
                requestHeaders['Content-Type'] = 'application/json';
            }
            else {
                requestHeaders['Content-Type'] = 'text/plain';
            }
        }
        const fetchOptions = { method, headers: requestHeaders };
        if (body && !['GET', 'HEAD'].includes(method)) {
            fetchOptions.body = (requestHeaders['Content-Type'] === 'application/x-www-form-urlencoded' && typeof body === 'object')
                ? this.toFormUrlEncoded(body)
                : (typeof body === 'object' ? JSON.stringify(body) : body);
        }
        if (formData && !['GET', 'HEAD'].includes(method))
            fetchOptions.body = this.toFormData(formData);
        if (isVerbose)
            this.logger.log(`\n📤 HTTP Request: ${method} ${url}`);
        const startTime = Date.now();
        const response = await fetch(url, fetchOptions);
        const duration = Date.now() - startTime;
        const responseHeaders = {};
        response.headers.forEach((v, k) => responseHeaders[k] = v);
        const responseText = await response.text();
        let responseBody;
        try {
            responseBody = JSON.parse(responseText);
        }
        catch {
            responseBody = responseText;
        }
        const cookies = {};
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            // Handle multiple cookies separated by comma
            const cookieStrings = setCookie.split(/,(?=[^\s])/);
            for (const cookieStr of cookieStrings) {
                const parts = cookieStr.split(';');
                if (parts.length > 0) {
                    const [n, v] = parts[0].split('=');
                    if (n && v) {
                        cookies[n.trim()] = v.trim();
                    }
                }
            }
        }
        if (isVerbose)
            this.logger.log(`📥 HTTP Response: ${response.status} (${duration}ms)`);
        return {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
            cookies,
            responseTime: duration,
        };
    }
    setVerbose(verbose) { this.verbose = verbose; }
    setLogger(logger) { this.logger = logger; }
    async get(url, options) { return this.request({ method: 'GET', url, ...options }); }
    async post(url, body, options) { return this.request({ method: 'POST', url, body, ...options }); }
    async put(url, body, options) { return this.request({ method: 'PUT', url, body, ...options }); }
    async patch(url, body, options) { return this.request({ method: 'PATCH', url, body, ...options }); }
    async delete(url, options) { return this.request({ method: 'DELETE', url, ...options }); }
}
