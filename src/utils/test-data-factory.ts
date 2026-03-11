/**
 * Test Data Factory for Hop testing framework
 * Uses dynamic import for @faker-js/faker to make it optional
 */

export interface FakerOptions {
  locale?: string;
}

export interface DataTemplate {
  [key: string]: string | DataTemplate | any;
}

export class TestDataFactory {
  private faker: any = null;
  private initialized: boolean = false;
  
  /**
   * Initialize faker (dynamically imported)
   */
  async init(options: FakerOptions = {}): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Try to import faker
      const fakerModule = await import('@faker-js/faker');
      const { faker } = fakerModule;
      
      if (options.locale) {
        // Set locale if specified
        // faker.setDefaultRefDate(new Date());
      }
      
      this.faker = faker;
      this.initialized = true;
    } catch (error) {
      console.warn('Faker not installed. Install with: bun add @faker-js/faker');
      throw new Error('Faker is not installed. Run: bun add @faker-js/faker');
    }
  }
  
  /**
   * Generate a single value based on type
   */
  generate(type: string): any {
    if (!this.faker) {
      throw new Error('Faker not initialized. Call init() first.');
    }
    
    switch (type.toLowerCase()) {
      // Names
      case 'firstname':
      case 'firstName':
        return this.faker.person.firstName();
      case 'lastname':
      case 'lastName':
        return this.faker.person.lastName();
      case 'fullname':
      case 'fullName':
        return this.faker.person.fullName();
      case 'name':
        return this.faker.person.fullName();
      
      // Contact
      case 'email':
        return this.faker.internet.email();
      case 'phone':
      case 'phoneNumber':
        return this.faker.phone.number();
      case 'username':
        return this.faker.internet.username();
      
      // Internet
      case 'url':
        return this.faker.internet.url();
      case 'ipv4':
        return this.faker.internet.ipv4();
      case 'ipv6':
        return this.faker.internet.ipv6();
      case 'uuid':
        return this.faker.string.uuid();
      
      // Address
      case 'city':
        return this.faker.location.city();
      case 'country':
        return this.faker.location.country();
      case 'street':
        return this.faker.location.street();
      case 'address':
        return this.faker.location.streetAddress();
      case 'zipcode':
      case 'zipCode':
        return this.faker.location.zipCode();
      case 'state':
        return this.faker.location.state();
      
      // Company
      case 'company':
        return this.faker.company.name();
      case 'companyname':
        return this.faker.company.name();
      case 'jobtitle':
      case 'jobTitle':
        return this.faker.person.jobTitle();
      
      // Dates
      case 'date':
        return this.faker.date.past().toISOString();
      case 'datetime':
        return this.faker.date.past().toISOString();
      case 'futuredate':
        return this.faker.date.future().toISOString();
      case 'timestamp':
        return this.faker.date.past().getTime();
      
      // Numbers
      case 'number':
      case 'int':
        return this.faker.number.int({ min: 0, max: 1000 });
      case 'float':
        return this.faker.number.float({ min: 0, max: 1000, precision: 0.01 });
      case 'boolean':
        return this.faker.datatype.boolean();
      
      // Text
      case 'word':
        return this.faker.word.sample();
      case 'sentence':
        return this.faker.lorem.sentence();
      case 'paragraph':
        return this.faker.lorem.paragraph();
      case 'text':
        return this.faker.lorem.text();
      
      // Lorem
      case 'lorem':
        return this.faker.lorem.words(5);
      case 'words':
        return this.faker.lorem.words();
      
      // Color
      case 'color':
        return this.faker.internet.color();
      
      // Image
      case 'avatar':
        return this.faker.image.avatar();
      case 'image':
        return this.faker.image.url();
      
      // Credit Card
      case 'creditcard':
      case 'creditCard':
        return this.faker.finance.creditCardNumber();
      
      // Currency
      case 'currency':
        return this.faker.finance.currencyCode();
      case 'amount':
        return this.faker.finance.amount();
      
      // Password
      case 'password':
        return this.faker.internet.password();
      
      // Hex
      case 'hex':
        return this.faker.string.hexadecimal();
      
      // Alpha
      case 'alpha':
        return this.faker.string.alpha();
      case 'alphanumeric':
      case 'alphanum':
        return this.faker.string.alphanumeric();
      
      default:
        // Try to return the type as-is or generate a word
        return this.faker.word.sample();
    }
  }
  
  /**
   * Generate data from a template
   */
  generateFromTemplate(template: DataTemplate): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string') {
        // Check if it's a faker expression like '{{firstName}}' or 'firstName'
        if (value.startsWith('{{') && value.endsWith('}}')) {
          // Remove {{ and }}
          const type = value.slice(2, -2).trim();
          result[key] = this.generate(type);
        } else if (value.includes('{{') && value.includes('}}')) {
          // Replace all occurrences
          let generated = value;
          const regex = /\{\{([^}]+)\}\}/g;
          let match;
          while ((match = regex.exec(value)) !== null) {
            const type = match[1].trim();
            generated = generated.replace(match[0], this.generate(type));
          }
          result[key] = generated;
        } else {
          // Try to generate directly
          result[key] = this.generate(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.generateFromTemplate(value as DataTemplate);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Generate an array of data
   */
  generateArray(template: DataTemplate, count: number): Record<string, any>[] {
    const results: Record<string, any>[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.generateFromTemplate(template));
    }
    return results;
  }
  
  /**
   * Create a user data template
   */
  static userTemplate(): DataTemplate {
    return {
      firstName: '{{firstName}}',
      lastName: '{{lastName}}',
      email: '{{email}}',
      phone: '{{phone}}',
      username: '{{username}}',
      address: {
        street: '{{address}}',
        city: '{{city}}',
        state: '{{state}}',
        zipCode: '{{zipCode}}',
        country: '{{country}}',
      },
      company: '{{company}}',
      jobTitle: '{{jobTitle}}',
    };
  }
  
  /**
   * Create a product data template
   */
  static productTemplate(): DataTemplate {
    return {
      name: '{{word}}',
      description: '{{sentence}}',
      price: '{{amount}}',
      category: '{{word}}',
      sku: '{{alphanumeric}}',
      inStock: '{{boolean}}',
    };
  }
  
  /**
   * Create an order data template
   */
  static orderTemplate(): DataTemplate {
    return {
      orderId: '{{uuid}}',
      customer: {
        name: '{{fullName}}',
        email: '{{email}}',
      },
      items: [
        {
          product: '{{word}}',
          quantity: '{{number}}',
          price: '{{amount}}',
        },
      ],
      total: '{{amount}}',
      status: 'pending',
      createdAt: '{{datetime}}',
    };
  }
}

// Export singleton instance
export const testDataFactory = new TestDataFactory();
