import { Database } from 'bun:sqlite';
export class DbManager {
    connection = null;
    config = null;
    /**
     * Connect to the database
     */
    connect(config) {
        this.config = config;
        const type = config.type || 'sqlite';
        if (type === 'sqlite') {
            try {
                this.connection = new Database(config.url);
                console.log(`🗄️  Connected to SQLite database: ${config.url}`);
            }
            catch (error) {
                throw new Error(`Failed to connect to SQLite: ${error instanceof Error ? error.message : error}`);
            }
        }
        else {
            throw new Error(`Database type '${type}' is not yet supported. Only 'sqlite' is currently available.`);
        }
    }
    /**
     * Execute a SQL command (INSERT, UPDATE, DELETE, CREATE)
     */
    execute(sql, params = []) {
        this.ensureConnected();
        try {
            const query = this.connection.prepare(sql);
            query.run(...params);
        }
        catch (error) {
            throw new Error(`SQL execution failed: ${error instanceof Error ? error.message : error}\nSQL: ${sql}`);
        }
    }
    /**
     * Run a SQL query and return results as array of objects
     */
    query(sql, params = []) {
        this.ensureConnected();
        try {
            const query = this.connection.prepare(sql);
            return query.all(...params);
        }
        catch (error) {
            throw new Error(`SQL query failed: ${error instanceof Error ? error.message : error}\nSQL: ${sql}`);
        }
    }
    /**
     * Close the database connection
     */
    close() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
            console.log('🗄️  Database connection closed');
        }
    }
    ensureConnected() {
        if (!this.connection) {
            throw new Error('Database not connected. Call db.connect(config) first.');
        }
    }
}
