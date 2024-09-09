import { Pool } from "pg";

export class Database {
    static #instance: Database;
    pool: Pool;

    constructor() {
        this.pool = new Pool({
            user: 'postgres',
            host: 'your_host',
            database: 'your_database',
            password: 'password',
            port: 5432,
            max: 20, // maximum number of connections in the pool
            idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
            connectionTimeoutMillis: 2000, // how long to wait for a connection to be established
        });
    }

    public static get instance(): Database {
        if (!Database.#instance) {
            Database.#instance = new Database();
        }

        return Database.#instance;
    }

    public initializeConnection() {

    }
}