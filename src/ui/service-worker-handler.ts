import type { Page } from 'playwright-core';

export interface ServiceWorkerOptions {
  scope?: string;
  type?: 'classical' | 'module';
}

export class ServiceWorkerHandler {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async register(scriptURL: string, options: ServiceWorkerOptions = {}): Promise<void> {
    await this.page.evaluate(async (url, opts) => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register(url, {
          scope: opts.scope,
          type: opts.type,
        });
        console.log('Service Worker registered:', registration.scope);
      }
    }, scriptURL, options);
  }

  async unregister(scope?: string): Promise<void> {
    if (!scope) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    } else {
      const registration = await navigator.serviceWorker.getRegistration(scope);
      if (registration) {
        await registration.unregister();
      }
    }
  }

  async getRegistration(): Promise<ServiceWorkerRegistration | null> {
    return await this.page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        return navigator.serviceWorker.getRegistration();
      }
      return null;
    });
  }

  async getAllRegistrations(): Promise<any[]> {
    return await this.page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        return navigator.serviceWorker.getRegistrations();
      }
      return [];
    });
  }

  async getActiveWorker(): Promise<ServiceWorker | null> {
    return await this.page.evaluate(() => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        return navigator.serviceWorker.controller;
      }
      return null;
    });
  }

  async sendMessage(message: any): Promise<any> {
    return await this.page.evaluate(async (msg) => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          return new Promise((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => resolve(event.data);
            registration.active.postMessage(msg, [channel.port2]);
          });
        }
      }
      return null;
    }, message);
  }

  async simulateOnline(online: boolean): Promise<void> {
    await this.page.evaluate((isOnline) => {
      Object.defineProperty(navigator, 'onLine', {
        value: isOnline,
        configurable: true,
      });
      window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
    }, online);
  }

  async mockNetworkOffline(): Promise<void> {
    await this.page.route('**', async (route) => {
      const url = route.request().url();
      if (url.startsWith('http')) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
  }

  async clearCaches(): Promise<void> {
    await this.page.evaluate(async () => {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
    });
  }

  async getCacheNames(): Promise<string[]> {
    return await this.page.evaluate(async () => {
      if ('caches' in window) {
        return await caches.keys();
      }
      return [];
    });
  }

  async addToCache(cacheName: string, urls: string[]): Promise<void> {
    await this.page.evaluate(async (name, urlList) => {
      if ('caches' in window) {
        const cache = await caches.open(name);
        await cache.addAll(urlList);
      }
    }, cacheName, urls);
  }

  async getCacheContent(cacheName: string): Promise<Response[]> {
    return await this.page.evaluate(async (name) => {
      if ('caches' in window) {
        const cache = await caches.open(name);
        return await cache.keys();
      }
      return [];
    }, cacheName);
  }

  isReady(): Promise<boolean> {
    return this.page.evaluate(() => {
      if ('serviceWorker' in navigator) {
        return navigator.serviceWorker.ready.then(() => true).catch(() => false);
      }
      return Promise.resolve(false);
    });
  }

  async waitForReady(timeout = 5000): Promise<void> {
    return await this.page.evaluate(async (ms) => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      } else {
        throw new Error('Service Workers not supported');
      }
    }, timeout);
  }
}

export function createServiceWorkerHandler(page: Page): ServiceWorkerHandler {
  return new ServiceWorkerHandler(page);
}