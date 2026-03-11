import type { Step, TestContext } from '../../types/index.js';
import type { StepHandler, IStepExecutor } from './types.js';
import { resolveEnvVariables as resolveEnv } from '../../utils/env-loader.js';
import type { HttpMethod } from '../../types/index.js';

export class HttpHandler implements StepHandler {
  canHandle(text: string): boolean {
    return text.match(/^(?:\*|Given|When|Then|And|But)?\s*url ['"]/i) !== null ||
           text.match(/^(?:\*|Given|When|Then|And|But)?\s*path ['"]/i) !== null ||
           text.match(/^(?:\*|Given|When|Then|And|But)?\s*header .+ =/i) !== null ||
           text.match(/^(?:\*|Given|When|Then|And|But)?\s*headers\s+(\{[\s\S]*\})/i) !== null ||
           text.match(/^(?:\*|Given|When|Then|And|But)?\s*(query param |param )/i) !== null ||
           text.match(/^(?:\*|Given|When|Then|And|But)?\s*params\s+(\{[\s\S]*\})/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*request/i) !== null ||
           text.match(/^(?:\*|Given|When|Then|And|But)?\s*method (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i) !== null ||
           text.match(/^(Given|When|Then|And|But)?\s*form field (\w+)\s*=\s*(.+)$/i) !== null;
  }

  async handle(text: string, step: Step, context: TestContext, executor: IStepExecutor): Promise<void> {
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*url ['"](.+)['"]/i)) {
      const url = executor.extractValue(text, /^(?:\*|Given|When|Then|And|But)?\s*url ['"](.+)['"]/i);
      context.baseUrl = resolveEnv(url, executor.getEnvConfig());
      return;
    }
    
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*path ['"](.+)['"]/i)) {
      const path = executor.extractValue(text, /^(?:\*|Given|When|Then|And|But)?\s*path ['"](.+)['"]/i);
      context.path = executor.resolveVariables(resolveEnv(path, executor.getEnvConfig()), context);
      return;
    }
    
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*header .+ =/i)) {
      const [key, value] = executor.parseKeyValue(text.replace(/^(?:\*|Given|When|Then|And|But)?\s*header /i, ''));
      context.headers[key] = executor.resolveVariables(value, context);
      return;
    }
    
    const headersJsonMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*headers\s+(\{[\s\S]*\})/i);
    if (headersJsonMatch) {
      try {
        const headersObj = JSON.parse(headersJsonMatch[2]);
        for (const [key, value] of Object.entries(headersObj)) {
          context.headers[key] = executor.resolveVariables(value, context);
        }
      } catch {}
      return;
    }
    
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*(query param |param )/i)) {
      const [key, value] = executor.parseKeyValue(text.replace(/^(?:\*|Given|When|Then|And|But)?\s*(?:query param |param )/i, ''));
      context.queryParams[key] = executor.resolveVariables(value, context);
      return;
    }
    
    const paramsJsonMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*params\s+(\{[\s\S]*\})/i);
    if (paramsJsonMatch) {
      try {
        const paramsObj = JSON.parse(paramsJsonMatch[2]);
        for (const [key, value] of Object.entries(paramsObj)) {
          context.queryParams[key] = executor.resolveVariables(value, context);
        }
      } catch {}
      return;
    }
    
    if (text.match(/^(Given|When|Then|And|But)?\s*request/i)) {
      if (text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request \{|request ['"]/i)) {
        const body = executor.extractJsonBody(text);
        context.body = executor.resolveVariables(body, context);
        return;
      }
      
      if (text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request #(.*)/i)) {
        const varName = text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request #(.*)/i)?.[1];
        if (varName) {
          context.body = context.variables[varName.trim()];
        }
        return;
      }
      
      if (step.docString) {
        try {
          context.body = JSON.parse(step.docString);
        } catch {
          context.body = step.docString;
        }
        return;
      }
      
      if (step.dataTable) {
        context.body = executor.convertDataTable(step.dataTable);
        return;
      }
      return;
    }
    
    const methodMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*method (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i);
    if (methodMatch) {
      context.method = methodMatch[1].toUpperCase() as HttpMethod;
      
      const fullUrl = executor.buildUrl(context.baseUrl, context.path, context.queryParams);
      const response = await executor.getHttpClient().request({
        method: context.method,
        url: fullUrl,
        headers: context.headers,
        body: context.body,
        formData: context.formData,
      });
      
      context.response = response;
      
      context.variables['response'] = response.body;
      context.variables['status'] = response.status;
      context.variables['responseTime'] = (response as any).responseTime || 0;
      
      if (response.cookies) {
        context.cookies = { ...context.cookies, ...response.cookies };
      }
      return;
    }
    
    const formFieldMatch = text.match(/^(Given|When|Then|And|But)?\s*form field (\w+)\s*=\s*(.+)$/i);
    if (formFieldMatch) {
      const fieldName = formFieldMatch[2];
      const fieldValue = executor.resolveVariables(formFieldMatch[3], context);
      
      if (!context.formData) {
        context.formData = {};
      }
      context.formData[fieldName] = fieldValue;
      return;
    }
  }
}
