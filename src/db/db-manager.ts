import { Database } from 'bun:sqlite';

export interface DbConfig {
  url: string;
  type?: 'sqlite' | 'postgres' | 'mysql'; // For future expansion
}

export class DbManager {
  private connection: any = null;
  private config: DbConfig | null = null;

  /**
   * Connect to the database
   */
  connect(config: DbConfig): void {
    this.config = config;
    
    const type = config.type || 'sqlite';
    
    if (type === 'sqlite') {
      try {
        this.connection = new Database(config.url);
        console.log(`🗄️  Connected to SQLite database: ${config.url}`);
      } catch (error) {
        throw new Error(`Failed to connect to SQLite: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      throw new Error(`Database type '${type}' is not yet supported. Only 'sqlite' is currently available.`);
    }
  }

  /**
   * Execute a SQL command (INSERT, UPDATE, DELETE, CREATE)
   */
  execute(sql: string, params: any[] = []): void {
    this.ensureConnected();
    
    try {
      const query = this.connection.prepare(sql);
      query.run(...params);
    } catch (error) {
      throw new Error(`SQL execution failed: ${error instanceof Error ? error.message : error}\nSQL: ${sql}`);
    }
  }

  /**
   * Run a SQL query and return results as array of objects
   */
  query(sql: string, params: any[] = []): any[] {
    this.ensureConnected();
    
    try {
      const query = this.connection.prepare(sql);
      return query.all(...params);
    } catch (error) {
      throw new Error(`SQL query failed: ${error instanceof Error ? error.message : error}\nSQL: ${sql}`);
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
      console.log('🗄️  Database connection closed');
    }
  }

  private ensureConnected(): void {
    if (!this.connection) {
      throw new Error('Database not connected. Call db.connect(config) first.');
    }
  }
}
