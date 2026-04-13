/**
 * GraphQL client for Hop testing framework
 */
export class GraphQLClient {
    baseUrl;
    defaultHeaders;
    constructor(baseUrl, headers = {}) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };
    }
    /**
     * Execute a GraphQL query
     */
    async query(query, variables, operationName) {
        const body = { query };
        if (variables) {
            body.variables = variables;
        }
        if (operationName) {
            body.operationName = operationName;
        }
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: this.defaultHeaders,
            body: JSON.stringify(body),
        });
        const responseBody = await response.json();
        // Get cookies from Set-Cookie header
        const cookies = {};
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
            const cookieParts = setCookie.split(';');
            if (cookieParts.length > 0) {
                const [name, value] = cookieParts[0].split('=');
                cookies[name] = value;
            }
        }
        // Get response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        return {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
            cookies,
            data: responseBody.data,
            errors: responseBody.errors,
        };
    }
    /**
     * Execute a GraphQL mutation
     */
    async mutation(mutation, variables, operationName) {
        return this.query(mutation, variables, operationName);
    }
    /**
     * Execute a GraphQL subscription (via WebSocket)
     */
    async *subscribe(query, variables) {
        const wsUrl = this.baseUrl.replace(/^http/, 'ws');
        const ws = new WebSocket(wsUrl);
        // Wait for connection
        await new Promise((resolve, reject) => {
            ws.onopen = () => resolve();
            ws.onerror = (error) => reject(error);
        });
        // Send subscription query
        ws.send(JSON.stringify({
            query,
            variables,
        }));
        // Yield each message
        while (true) {
            const message = await new Promise((resolve) => {
                ws.onmessage = (event) => resolve(JSON.parse(event.data));
            });
            if (message.errors) {
                throw new Error(`GraphQL subscription errors: ${JSON.stringify(message.errors)}`);
            }
            if (message.data) {
                yield message.data;
            }
        }
    }
    /**
     * Set authorization header
     */
    setAuthorization(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    /**
     * Set custom headers
     */
    setHeaders(headers) {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }
    /**
     * Build a GraphQL query string from template
     */
    static buildQuery(queryName, fields, variables) {
        const fieldsStr = fields.join('\n');
        const varDefs = variables
            ? `(${(Object.keys(variables).map(k => `${k}: ${variables[k]}`)).join(', ')})`
            : '';
        return `query ${queryName}${varDefs} {
  ${fieldsStr}
}`;
    }
    /**
     * Build a GraphQL mutation string from template
     */
    static buildMutation(mutationName, inputFields, returnFields) {
        const inputStr = `{${Object.entries(inputFields).map(([k, v]) => `${k}: ${v}`).join(', ')}}`;
        const fieldsStr = returnFields.join('\n');
        return `mutation ${mutationName}($input: ${mutationName}Input!) {
  ${mutationName}(input: $input) {
    ${fieldsStr}
  }
}`;
    }
}
