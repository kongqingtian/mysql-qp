const mysql = require('mysql');
const moment = require('moment');
const uuid = require("uuid/v4");
// let Processor = require('../1. abstract/qpAbstract');

const BASIC_TYPE_CAST = (field, next) => {
    if (field.type == 'JSON') {
        return JSON.parse(field.string());
    }
    if (field.type == 'TIMESTAMP' || field.type == 'DATETIME') {
        let str = field.string();
        if (str != null)
            return moment(str).format('YYYY-MM-DD HH:mm:ss');
        else
            return str;
    }
    if (field.type == 'DATE') {
        let str = field.string();
        if (str != null)
            return moment(str).format('YYYY-MM-DD');
        else
            return str;
    }
    return next();
}

function qpV1(Processor) {
    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeUpdatePromise = async function (query, params, dbConfig) {
        return new Promise(async (resolve, reject) => {
            let con; let result;
            try {
                params = params || [];
                //perform db work
                con = await this.connectToDb(dbConfig);
                result = await this.query(con, query, params);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    }
    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeUpdateIgnorePromise = function (query, params, dbConfig) {
        return new Promise(async (resolve, reject) => {
            let con;
            try {
                params = params || [];
                //perform db work
                con = await this.connectToDb(dbConfig);
                let result = await this.query(con, query, params);
                resolve(result);
            } catch (err) {
                resolve(err);
            }
        });
    }

    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeAndFetchToMapPromise = async function (key, query, params, dbConfig) {
        return new Promise(async (resolve, reject) => {
            let con;
            try {
                params = params || [];
                //perform db work
                con = await this.connectToDb(dbConfig);
                var options = {
                    sql: query, typeCast: this.TYPE_CAST || BASIC_TYPE_CAST
                };
                let result = await this.query(con, options, params);
                let customMap = {
                    map: new Map(),
                    get: (key) => {
                        return customMap.map.get(key);
                    },
                    set: (key, value) => {
                        customMap.map.set(key, value);
                    },
                    keys: () => {
                        return customMap.map.keys();
                    },
                    values: () => {
                        return customMap.map.values();
                    },
                    toJSON: () => {
                        return Array.from(customMap.map.values());
                    },
                    toValuesArray: () => {
                        return Array.from(customMap.map.values());
                    },
                    toKeysArray: () => {
                        return Array.from(customMap.map.keys());
                    }
                }
                for (let data of result) {
                    let mapKey = data[key];
                    if (mapKey != null) {
                        if (customMap.get(mapKey)) {
                            throw new Error(`${key} must be unique !! ${JSON.stringify(data)}`);
                        } else {
                            customMap.set(mapKey, data);
                        }
                    } else {
                        throw new Error(`${key} must not be null !! ${JSON.stringify()}`);
                    }
                }
                resolve(customMap);
            } catch (err) {
                reject(err);
            }
        })
    }

    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.getCurrentTimestamp = function (con, dbConfig) {
        return new Promise(async (resolve, reject) => {
            this.console(`deprecated. please use dbTime()`);
            try {
                let query = `select current_timestamp as time from DUAL`;
                let option = {
                    sql: query, typeCast: (field, next) => {
                        return moment(field.string()).format('YYYY-MM-DD HH:mm:ss');
                    }
                };
                if (con) {
                    con.query(option, [], (err, result) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            let r = result[0];
                            resolve(r.time);
                        }
                    })
                } else {
                    con = await this.connectToDb(dbConfig);
                    let result = await this.query(con, option);
                    if (result) {
                        let r = result[0];
                        resolve(r.time);
                    }
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeAndFetchOriginPromise = async function (query, params, dbConfig) {
        this.console(`deprecated. please use raw()`);


        return new Promise(async (resolve, reject) => {
            let con;
            try {
                params = params || [];
                //perform db work
                con = await this.connectToDb(dbConfig);
                var options = {
                    sql: query, typeCast: (field, next) => {
                        return next();
                    }
                };
                let result = await this.query(con, options, params);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        })
    }

    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeAndFetchFirstOriginPromise = function (query, params, dbConfig) {
        this.debug(`deprecated. please use rawFirst()`);

        return new Promise(async (resolve, reject) => {
            try {
                params = params || [];
                //perform db work
                var con = await this.connectToDb(dbConfig);
                var options = {
                    sql: query, typeCast: (field, next) => {
                        return next();
                    }
                };
                let result = await this.query(con, options, params);
                resolve(result[0]);
            } catch (err) {
                reject(err);
            }
        });
    }
    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeAndFetchPromise = async function (query, params, dbConfig) {
        return new Promise(async (resolve, reject) => {
            let con;
            try {
                params = params || [];
                //perform db work
                con = await this.connectToDb(dbConfig);
                var options = {
                    sql: query, typeCast: this.TYPE_CAST || BASIC_TYPE_CAST
                };
                let result = await this.query(con, options, params);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        })
    }

    /**
     * 
     * @param {String} query 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeAndFetchFirstPromise = function (query, params, dbConfig) {
        return new Promise(async (resolve, reject) => {
            try {
                params = params || [];
                //perform db work
                let con = await this.connectToDb(dbConfig);
                let options = {
                    sql: query, typeCast: function (field, next) {
                        if (field.type == 'JSON') {
                            return JSON.parse(field.string());
                        }
                        if (field.type == 'TIMESTAMP' || field.type == 'DATETIME') {
                            let str = field.string();
                            if (str != null)
                                return moment(str).format('YYYY-MM-DD HH:mm:ss');
                            else
                                return str;
                        }
                        if (field.type == 'DATE') {
                            let str = field.string();
                            if (str != null)
                                return moment(str).format('YYYY-MM-DD');
                            else
                                return str;
                        }
                        return next();
                    }
                };
                let result = await this.query(con, options, params);
                if (result)
                    resolve(result[0]);
            } catch (err) {
                reject(err);
            }
        });
    }
    /**
     * 
     * @param {Object} options 
     * @param {Object[]=} params 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeAndFetchWithOptionsPromise = function (options, params, dbConfig) {
        return new Promise(async (resolve, reject) => {
            try {
                params = params || [];
                //perform db work
                let con = await this.connectToDb(dbConfig);
                let result = await this.query(con, options, params);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        })
    }

    /**
     * 
     * @param {Object} query 
     * @param {*=} dbConfig 
     */
    Processor.prototype.executeRaw = function (query, dbConfig, params, con) {
        return new Promise(async (resolve, reject) => {
            params = params || [];
            var option = {
                sql: query, typeCast: function (field, next) {
                    // without parsing the json
                    if (field.type == 'TIMESTAMP' || field.type == 'DATETIME') {
                        let str = field.string();
                        if (str != null)
                            return moment(str).format('YYYY-MM-DD HH:mm:ss');
                        else
                            return str;
                    }
                    if (field.type == 'DATE') {
                        let str = field.string();
                        if (str != null)
                            return moment(str).format('YYYY-MM-DD');
                        else
                            return str;
                    }

                    return next();
                }
            };
            try {
                if (!dbConfig && !con) {
                    return reject(new Error(`DB CONFIG MUST BE PROVIDED`));
                }
                let connection;
                if (con) {
                    con.query(option, params, (err, result) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            resolve(result);
                        }
                    })
                } else if (dbConfig) {
                    connection = mysql.createConnection({
                        host: dbConfig.host,
                        user: dbConfig.user,
                        password: dbConfig.password,
                        database: dbConfig.database,
                        connectTimeout: 60 * 1000,
                        acquireTimeout: 60 * 1000,
                        timeout: 60 * 1000,
                    })
                    connection.connect(function (err) {
                        if (err) {
                            return reject(err);
                        }
                        connection.query(option, params, (error, results, fields) => {
                            if (error) return reject(error);
                            connection.destroy();
                            return resolve(results);
                        });
                    });
                }
            } catch (err) {
                reject(err);
            }
        })
    }
    /**
     * 
     * @param {*=} db 
     */
    Processor.prototype.connectWithTbegin = function (db) {
        return new Promise(async (resolve, reject) => {
            try {
                let con;
                if (!db) {
                    con = await this.connectToDb();
                } else {
                    const info = {
                        host: db.host || this.host,
                        user: db.user || this.user,
                        password: db.password || this.password,
                        database: db.database || this.database,
                        port: db.port || this.port || `3306`,
                        connectTimeout: 60 * 1000,
                        acquireTimeout: 60 * 1000,
                        timeout: 60 * 1000,
                    };
                    con = await this.connectToDb(info);
                }
                con.beginTransaction((err) => {
                    if (err) {
                        err.status = 409;
                        return reject(err);
                    }
                    let transactionId = uuid();
                    con.transactionId = transactionId;
                    this.activeTransactions.set(transactionId, { startTime: moment().format(`YYYY-MM-DD HH:mm:ss`), con: con });
                    let timer = setTimeout(() => {
                        if (this.activeTransactions.get(con.transactionId)) {
                            this.console(`Warning: transaction is still active! Active transactions: ${this.activeTransactions.size}`);
                        } else {
                            // clearInterval(timer);
                        }
                    }, this.transactionThreshold);
                    return resolve(con);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * 
     * @param {String} query 
     * @param {Object[]} params 
     * @param {Object[]} con 
     */
    Processor.prototype.execute = function (query, params, con) {
        return new Promise((resolve, reject) => {
            params = params || [];

            if (!con) {
                throw new Error('undefined connection');
            }
            var option = {
                sql: query, typeCast: this.TYPE_CAST || BASIC_TYPE_CAST
            };
            con.query(option, params, (err, result) => {
                if (err) {
                    err.status = 409;
                    return reject(err);
                } else {
                    resolve(result);
                }
            })
        });
    }

    /**
     * @param {String} key
     * @param {String} query 
     * @param {Object[]} params 
     * @param {Object[]} con 
     */
    Processor.prototype.executeToMap = function (key, query, params, con) {
        return new Promise((resolve, reject) => {
            params = params || [];

            if (!con) {
                throw new Error('undefined connection');
            }
            var option = {
                sql: query, typeCast: this.TYPE_CAST || BASIC_TYPE_CAST
            };
            con.query(option, params, (err, result) => {
                if (err) {
                    err.status = 409;
                    return reject(err);
                } else {
                    let customMap = {
                        map: new Map(),
                        get: (key) => {
                            return customMap.map.get(key);
                        },
                        set: (key, value) => {
                            customMap.map.set(key, value);
                        },
                        keys: () => {
                            return customMap.map.keys();
                        },
                        values: () => {
                            return customMap.map.values();
                        },
                        toJSON: () => {
                            return Array.from(customMap.map.values());
                        },
                        toValuesArray: () => {
                            return Array.from(customMap.map.values());
                        },
                        toKeysArray: () => {
                            return Array.from(customMap.map.keys());
                        }
                    }
                    for (let data of result) {
                        let mapKey = data[key];
                        if (mapKey != null) {
                            if (customMap.get(mapKey)) {
                                throw new Error(`${key} must be unique !! ${JSON.stringify(data)}`);
                            } else {
                                customMap.set(mapKey, data);
                            }
                        } else {
                            throw new Error(`${key} must not be null !! ${JSON.stringify()}`);
                        }
                    }
                    resolve(customMap);
                }
            })
        });
    }
    /**
     * 
     * @param {String} query 
     * @param {Object[]} params 
     * @param {Object[]} con 
     */
    Processor.prototype.executeFirst = function (query, params, con) {
        return new Promise((resolve, reject) => {
            params = params || [];

            if (!con) {
                throw new Error('undefined connection');
            }
            var option = {
                sql: query, typeCast: this.TYPE_CAST || BASIC_TYPE_CAST
            };
            con.query(option, params, (err, result) => {
                if (err) {
                    err.status = 409;
                    return reject(err);
                } else {
                    resolve(result[0]);
                }
            })
        });
    }
    /**
     * 
     * @param {String} query 
     * @param {Object[]} params 
     * @param {Object[]} con 
     */
    Processor.prototype.executeWithOptions = function (option, params, con) {
        this.console(`deprecated, please use run`)
        return new Promise((resolve, reject) => {
            params = params || [];

            if (!con) {
                throw new Error('undefined connection');
            }

            con.query(option, params, (err, result) => {
                if (err) {
                    err.status = 409;
                    return reject(err);
                } else {
                    resolve(result);
                }
            })
        });
    }

    /**
     * 
     * @param {Object} con 
     */
    Processor.prototype.rollbackAndCloseConnection = function (con) {
        return new Promise((resolve, reject) => {
            if (!con) {
                return resolve();
            }

            if (con.state != 'authenticated') {
                return resolve();
            }
            if (con._pool) {
                if (con._pool._freeConnections.indexOf(con) !== -1) {
                    return resolve();
                }
            }
            con.rollback((err) => {
                try {
                    if (con._pool) {
                        // console.log(`Rolling back transaction ${con.transactionId} started at ${this.activeTransactions.get(con.transactionId).startTime}`);
                        con.release();
                        this.activeTransactions.delete(con.transactionId);
                        // console.log(`Transaction rolled back, active transactions remaining: ${this.activeTransactions.size}`);
                    } else
                        con.destroy();
                    if (err) {
                        err.status = 409;
                        reject(err);
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        })
    }

    /**
     * 
     * @param {Object} con 
     */
    Processor.prototype.commitAndCloseConnection = function (con) {
        return new Promise((resolve, reject) => {
            con.commit((err) => {
                try {
                    if (con._pool) {
                        // console.log(`Closing transaction ${con.transactionId} started at ${this.activeTransactions.get(con.transactionId).startTime}`);
                        con.release();
                        this.activeTransactions.delete(con.transactionId);
                        // console.log(`Transaction committed, active transactions remaining: ${this.activeTransactions.size}`);
                    } else
                        con.destroy();
                    if (err) {
                        err.status = 409;
                        reject(err);
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    reject(err);
                }

            });
        })
    }

    /**
     * 
     * @param {Object} con 
     */
    Processor.prototype.commitAndContinue = function (con) {
        return new Promise((resolve, reject) => {
            con.commit(function (err) {
                if (err) {
                    err.status = 409;
                    reject(err);
                } else {
                    resolve(null);
                }
            });
        })
    }

    Processor.prototype.buildDataBuilder = function (table, con) {
        return new Promise(async (resolve, reject) => {
            try {
                let descs;
                if (con) {
                    descs = await this.executeToMap(`Field`, `describe ??`, [table], con);
                } else {
                    descs = await this.executeAndFetchToMapPromise(`Field`, `describe ??`, [table]);
                }
                //construct
                let dao = {
                    columns: descs,
                    construct: (dto, allowNull) => {
                        dto = dto || {};
                        let columns = dao.columns;
                        let mainObject = {};
                        for (let key of columns.keys()) {
                            let desc = columns.get(key);
                            if (allowNull || dto[key] != null) {
                                mainObject[key] = dto[key];
                            } else {
                                if (desc.Type == `datetime` || desc.Type == `date` || desc.Type == `timestamp`) {
                                    // mainObject[key] = new Date();
                                } else {
                                    mainObject[key] = desc.Default;
                                }
                            }
                        }
                        return (mainObject);
                    },
                    getPk() {
                        for (let col of dao.columns.values()) {
                            if (col.Key == `PRI`) {
                                return col.Field;
                            }
                        }
                    }
                }
                resolve(dao);
            } catch (err) {
                reject(err);
            }
        });

    }

}

module.exports = qpV1;
