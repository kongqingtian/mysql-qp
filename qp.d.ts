export interface Config {
    limit?: string,
    host: string,
    user: string,
    password: string,
    port?: string,
    database: string
}
export interface Connection {
    threadId: number,
    state: string
}

export interface SERVER_STATUS_flags_enum {
    SERVER_STATUS_IN_TRANS: 1,
    SERVER_STATUS_AUTOCOMMIT: 2,
    SERVER_MORE_RESULTS_EXISTS: 8,
    SERVER_QUERY_NO_GOOD_INDEX_USED: 16,
    SERVER_QUERY_NO_INDEX_USED: 32,
    SERVER_STATUS_CURSOR_EXISTS: 64,
    SERVER_STATUS_LAST_ROW_SENT: 128,
    SERVER_STATUS_DB_DROPPED: 256,
    SERVER_STATUS_NO_BACKSLASH_ESCAPES: 512,
    SERVER_STATUS_METADATA_CHANGED: 1024,
    SERVER_QUERY_WAS_SLOW: 2048,
    SERVER_PS_OUT_PARAMS: 4096,
    SERVER_STATUS_IN_TRANS_READONLY: 8192
}

export interface RunResult {
    affectedRows: number,
    changedRows: number,
    fieldCount: number,
    insertId: number,
    message: string,
    protocol41: boolean,
    serverStatus: SERVER_STATUS_flags_enum,
    warningCount: string
}

export interface TransactionStatus {
    transactionId: string,
    startTime: string,
    con: Connection
}
export class Class { constructor(dao) };

export class Dao { }


export class Builder {
    readonly desc: Map<string, object>;
    construct(dto: object, allowNull: boolean): Dao;
    getPk(): string
}
export class QueryOption {
    sql: string;
    typeCast: object
}

export function presetConnection(config: Config): void;
export function presetTypeCast(typeCast: function): void;
export function presetConnection(host: string, user: string, password: string, database: string, limit: string, port: string): Promise<void>;
export function executeAndFetchPromise(query: string, params?: [], dbConfig?: Config): Promise<[object]>;
export function executeAndFetchFirstPromise(query: string, params?: [], dbConfig?: Config): Promise<object>;
export function executeUpdatePromise(query: string, params?: [], dbConfig?: Config): Promise<RunResult>;
export function executeUpdateIgnorePromise(query: string, params?: [], dbConfig?: Config): Promise<RunResult>;
export function executeAndFetchToMapPromise(key: string, query: string, params?: [], dbConfig?: Config): Promise<Map<string, object>>;
export function console(message: string): void;

export function connectWithTbegin(dbConfig?: Config): Promise<Connection>;
export function rollbackAndCloseConnection(dbConfig?: Config): Promise<void>;
export function commitAndCloseConnection(dbConfig?: Config): Promise<void>;
export function commitAndContinue(dbConfig?: Config): Promise<void>;

export function execute(query: string, params?: [], connection?: Connection): Promise<RunResult | [object]>;
export function executeFirst(query: string, params?: [], connection?: Connection): Promise<object>;
export function executeToMap(key: string, query: string, params?: [], connection?: Connection): Promise<Map<string, object>>;
export function buildDataBuilder(tableName: string | number, connection: Connection): Promise<Builder>;

export function select(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<[object]>;
export function selectFirst(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<object>;
export function selectMap(key: string, query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<Map<string, object>>;
export function selectMapArray(key: string, query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<Map<string, [object]>>;
export function run(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<RunResult>;
export function runIgnore(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<RunResult>;
export function scalar(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<[string]>;
export function scalarFirst(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<string>;
export function dbTime(dbConfig: Config | Connection): Promise<string>;
export function upsert(tableName: string, dao: Dao, dbConfig: Config | Connection, cols?: Array<string>): Promise<RunResult>;
export function raw(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<[object]>;
export function rawFirst(query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<object>;
export function sql(query: string, params?: [], dbConfig?: Config | Connection): Promise<RunResult>;
export function bulkUpsert(table: string, daoArr: Array<Dao>, dbConfig?: Config | Connection, cols?: Array<string>, chunkSize?: number): Promise<RunResult>;
export function bulkInsert(table: string, daoArr: Array<Dao>, isIgnore: Boolean, dbConfig?: Config | Connection, cols?: Array<string>, chunkSize?: number): Promise<RunResult>;
export function getActiveTransactions(): Array<TransactionStatus>;
export function resolveDependencies(tables?: Array<string>): Array<string>;

export function getBuilderSingleton(table: string, con: Connection): Promise<Builder>
export function printConstructor(table: string, con: Connection): Promise<void>
export function printBuilder(table: string, con: Connection): Promise<void>

export function selectClass(classType: Class, query: String | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<[Class]>;
export function selectClassFirst(classType: Class, query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<Class>;
export function selectClassMap(classType: Class, key: string, query: string | QueryOption, params?: [], dbConfig?: Config | Connection): Promise<Map<string, Class>>;
