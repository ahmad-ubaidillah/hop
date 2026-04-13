export class InterceptorManager {
    interceptors = [];
    add(interceptor) {
        this.interceptors.push(interceptor);
    }
    remove(interceptor) {
        const index = this.interceptors.indexOf(interceptor);
        if (index > -1)
            this.interceptors.splice(index, 1);
    }
    async runRequestInterceptors(options) {
        let processed = { ...options };
        for (const interceptor of this.interceptors) {
            if (interceptor.request)
                processed = await interceptor.request(processed);
        }
        return processed;
    }
    async runResponseInterceptors(response, options) {
        let result = response;
        for (const interceptor of this.interceptors) {
            if (interceptor.response)
                result = await interceptor.response(result, options);
        }
        return result;
    }
    async runErrorInterceptors(error, options) {
        let lastError = error;
        for (const interceptor of this.interceptors) {
            if (interceptor.error)
                lastError = await interceptor.error(lastError, options);
        }
        return lastError;
    }
}
