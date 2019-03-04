import { Database, OPEN_CREATE, OPEN_READWRITE } from 'sqlite3';

// tslint:disable-next-line:no-bitwise
const DEFAULT_MODE = OPEN_READWRITE | OPEN_CREATE;

const noop = (..._args: Array<any>) => {};

export interface SQLiteAdapterConfig {
  filename: string;
  mode: number;
}

interface RowResult {
  value: string;
}

/**
 * SQLiteAdapter is a bit of interop code to allow redux-persist to save keys
 * to sqlite.
 *
 * This is adapted from https://github.com/prsn/redux-persist-sqlite-storage,
 * but uses Node.js sqlite3 rather than react-native.
 */
export class SQLiteAdapter {
  private readonly sqlite: Promise<Database>;

  constructor(filename: string = ':memory:', mode: number = DEFAULT_MODE) {
    this.sqlite = this.initializeDatabase({
      filename,
      mode
    });
  }

  public async getItem(key: string, cb = noop) {
    const sqlite = await this.sqlite;
    return new Promise((resolve, reject) => {
      sqlite.get(
        'SELECT value FROM store WHERE key=?',
        [key],
        (error: Error | null, row: RowResult) => {
          if (error) {
            reject(error);
            cb(error);
          }
          const result = row ? row.value : undefined;
          resolve(result);
          cb(null, result);
        }
      );
    });
  }

  public async setItem(key: string, value: any, cb = noop) {
    const sqlite = await this.sqlite;
    return new Promise((resolve, reject) => {
      sqlite.get(
        'SELECT count(*) as count FROM store WHERE key=?',
        [key],
        (getError: Error | null, { count }: { count: number }) => {
          if (getError) {
            reject(getError);
            cb(getError);
          }
          if (count === 1) {
            sqlite.run(
              'UPDATE store SET value=? WHERE key=?',
              [value, key],
              (updateError: Error | null) => {
                if (updateError) {
                  reject(updateError);
                  cb(updateError);
                }
                resolve(value);
                cb(null, value);
              }
            );
          } else {
            sqlite.run(
              'INSERT INTO store VALUES (?,?)',
              [key, value],
              (insertError: Error | null) => {
                if (insertError) {
                  reject(insertError);
                  cb(insertError);
                }
                resolve(value);
                cb(null, value);
              }
            );
          }
        }
      );
    });
  }

  public async removeItem(key: string, cb = noop) {
    const sqlite = await this.sqlite;
    return new Promise((resolve, reject) => {
      sqlite.run(
        'DELETE FROM store WHERE key=?',
        [key],
        (error: Error | null) => {
          if (error) {
            reject(error);
            cb(error);
          }
          resolve(key);
          cb(null, key);
        }
      );
    });
  }

  public async getAllKeys(cb = noop) {
    const sqlite = await this.sqlite;
    return new Promise((resolve, _reject) => {
      sqlite.all(
        'SELECT key FROM store',
        [],
        (error: Error | null, rows: Array<{ key: string }>) => {
          if (error) {
            resolve([]);
            cb(null, []);
          }
          const result = rows.map(row => row.key);
          resolve(result);
          cb(null, result);
        }
      );
    });
  }

  public async clear(cb = noop) {
    const sqlite = await this.sqlite;
    return new Promise((resolve, reject) => {
      sqlite.run('DELETE FROM store', [], (error: Error | null) => {
        if (error) {
          reject(error);
          cb(error);
        }
        resolve();
      });
    });
  }

  private initializeDatabase({
    filename,
    mode
  }: SQLiteAdapterConfig): Promise<Database> {
    return new Promise((resolve, reject) => {
      const sqlite = new Database(filename, mode, (openError: Error | null) => {
        if (openError) {
          reject(openError);
        }

        sqlite.run(
          `CREATE TABLE IF NOT EXISTS store (key, value)`,
          (tableError: Error | null) => {
            if (tableError) {
              reject(tableError);
            }
            resolve(sqlite);
          }
        );
      });
    });
  }
}
