export const DevicePresets = {
    'Desktop HD': {
        name: 'Desktop HD',
        viewport: { width: 1920, height: 1080 },
    },
    'Desktop': {
        name: 'Desktop',
        viewport: { width: 1280, height: 720 },
    },
    'Tablet': {
        name: 'Tablet',
        viewport: { width: 768, height: 1024 },
    },
    'Mobile': {
        name: 'Mobile',
        viewport: { width: 375, height: 667 },
    },
    'Mobile Large': {
        name: 'Mobile Large',
        viewport: { width: 414, height: 896 },
    },
};
export function getDeviceConfig(deviceName) {
    return DevicePresets[deviceName] || null;
}
export class SemanticLocators {
    page;
    constructor(page) {
        this.page = page;
    }
    getByRole(role, options) {
        return this.page.getByRole(role, options);
    }
    getByLabel(text, options) {
        return this.page.getByLabel(text, options);
    }
    getByPlaceholder(text, options) {
        return this.page.getByPlaceholder(text, options);
    }
    getByText(text, options) {
        return this.page.getByText(text, options);
    }
    getByTestId(testId) {
        return this.page.getByTestId(testId);
    }
    getByAltText(text, options) {
        return this.page.getByAltText(text, options);
    }
    getByTitle(text, options) {
        return this.page.getByTitle(text, options);
    }
}
export function createSemanticLocators(page) {
    return new SemanticLocators(page);
}
