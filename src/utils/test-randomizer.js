/**
 * Test Randomizer - Provides test randomization with seed support
 */
/**
 * Test Randomizer with seed support for reproducibility
 */
export class TestRandomizer {
    seed;
    random;
    constructor(seed) {
        this.seed = seed ?? Date.now();
        this.random = this.seededRandom(this.seed);
    }
    /**
     * Create seeded random number generator
     */
    seededRandom(seed) {
        return () => {
            // Mulberry32 PRNG
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    /**
     * Get current seed
     */
    getSeed() {
        return this.seed;
    }
    /**
     * Set new seed
     */
    setSeed(seed) {
        this.seed = seed;
        this.random = this.seededRandom(seed);
    }
    /**
     * Get random number between 0 and 1
     */
    next() {
        return this.random();
    }
    /**
     * Get random integer between min and max (inclusive)
     */
    nextInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    /**
     * Shuffle an array in place using Fisher-Yates algorithm
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    /**
     * Shuffle scenarios within features
     * Preserves order within each feature but randomizes feature order\n   */
    shuffleScenarios(scenarios, seed) {
        if (seed)
            this.setSeed(seed);
        return this.shuffle(scenarios);
    }
    /**
     * Shuffle features and their scenarios\n   */
    shuffleFeatures(features, seed) {
        if (seed)
            this.setSeed(seed);
        // First shuffle the features themselves
        const shuffledFeatures = this.shuffle(features);
        // Then shuffle scenarios within each feature
        for (const feature of shuffledFeatures) {
            if (feature.scenarios && Array.isArray(feature.scenarios)) {
                feature.scenarios = this.shuffle(feature.scenarios);
            }
        }
        return shuffledFeatures;
    }
}
/**
 * Create a randomizer with optional seed
 */
export function createRandomizer(seed) {
    return new TestRandomizer(seed);
}
/**
 * Generate random test data using faker
 */
export function generateTestData(type, options = {}) {
    // Dynamic import to avoid loading faker when not needed
    try {
        const { faker } = require('@faker-js/faker');
        switch (type.toLowerCase()) {
            case 'name':
                return faker.person.fullName();
            case 'email':
                return faker.internet.email();
            case 'phone':
                return faker.phone.number();
            case 'address':
                return faker.location.streetAddress();
            case 'city':
                return faker.location.city();
            case 'country':
                return faker.location.country();
            case 'uuid':
                return faker.string.uuid();
            case 'date':
                return faker.date.past().toISOString();
            case 'datefuture':
                return faker.date.future().toISOString();
            case 'number':
                return faker.number.int({ min: options.min || 0, max: options.max || 100 });
            case 'boolean':
                return faker.datatype.boolean();
            case 'url':
                return faker.internet.url();
            case 'username':
                return faker.internet.username();
            case 'password':
                return faker.internet.password();
            case 'creditcard':
                return faker.finance.creditCardNumber();
            case 'company':
                return faker.company.name();
            case 'word':
                return faker.word.sample();
            case 'sentence':
                return faker.lorem.sentence();
            case 'paragraph':
                return faker.lorem.paragraph();
            default:
                return faker.word.sample();
        }
    }
    catch (error) {
        console.warn('Faker not available, using fallback');
        return generateFallbackData(type, options);
    }
}
function generateFallbackData(type, options) {
    const randomizer = new TestRandomizer();
    switch (type.toLowerCase()) {
        case 'name':
            return `Test User ${randomizer.nextInt(1, 1000)}`;
        case 'email':
            return `test${randomizer.nextInt(1, 1000)}@example.com`;
        case 'phone':
            return `+1-555-${randomizer.nextInt(100, 999)}-${randomizer.nextInt(1000, 9999)}`;
        case 'uuid':
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = randomizer.nextInt(0, 16);
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        case 'number':
            return randomizer.nextInt(options.min || 0, options.max || 100);
        case 'boolean':
            return randomizer.next() > 0.5;
        case 'url':
            return `https://example.com/${randomizer.nextInt(1, 1000)}`;
        default:
            return `test-${randomizer.nextInt(1, 1000)}`;
    }
}
