const moment = require('moment');
let mysql = require('mysql');
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
const RAW_TYPE_CAST = (field, next) => {
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

function qpV2(Processor) {

    Processor.prototype.select = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                params = params || [];
                let option = {
                    sql: query, typeCast: this.TYPE_CAST || BASIC_TYPE_CAST
                };
                if (query.sql) {
                    option = query;
                }
                //default without db
                if (!configOrDbCon || configOrDbCon.password || configOrDbCon.database) {
                    let con = await this.connectToDb(configOrDbCon);
                    let results = await this.query(con, option, params);
                    return resolve(results);
                } else {
                    let con = configOrDbCon;
                    //process transaction
                    con.query(option, params, (err, results) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            resolve(results)
                        }
                    })
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    Processor.prototype.selectFirst = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                params = params || [];
                let option = {
                    sql: query, typeCast: this.TYPE_CAST || BASIC_TYPE_CAST
                };
                if (query.sql) {
                    option = query;
                }
                if (option.sql.includes(`;`)) {
                    option.sql.replace(`;`, ` limit 1;`);
                } else {
                    option.sql = `${option.sql} limit 1;`;
                }
                //default without db
                if (!configOrDbCon || configOrDbCon.password || configOrDbCon.database) {
                    let con = await this.connectToDb(configOrDbCon);
                    let results = await this.query(con, option, params);
                    let result = results[0];
                    return resolve(result);
                } else {
                    let con = configOrDbCon;
                    //process transaction
                    con.query(option, params, (err, results) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            if (results.length) {
                                let result = results[0];
                                resolve(result)
                            } else {
                                resolve(null);
                            }
                        }
                    })
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    Processor.prototype.selectMap = function (key, query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let results = await this.select(query, params, configOrDbCon);
                let customMap = {
                    map: new Map(),
                    get: (key) => {
                        return customMap.map.get(key);
                    },
                    set: (key, value) => {
                        customMap.map.set(key, value);
                    },
                    delete: (key) => {
                        customMap.map.delete(key);
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
                for (let data of results) {
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
    Processor.prototype.selectMapArray = function (key, query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let results = await this.select(query, params, configOrDbCon);
                let customMap = {
                    map: new Map(),
                    get: (key) => {
                        return customMap.map.get(key) || [];
                    },
                    exists: (key) => {
                        return customMap.map.get(key) != null;
                    },
                    add: (key, value) => {
                        let arr = customMap.map.get(key);
                        if (!arr) {
                            arr = new Array();
                            customMap.map.set(key, arr);
                        }
                        arr.push(value);
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
                for (let data of results) {
                    let mapKey = data[key];
                    if (mapKey != null) {
                        customMap.add(mapKey, data);
                    } else {
                        throw new Error(`${key} must not be null !! ${JSON.stringify(data)}`);
                    }
                }
                resolve(customMap);
            } catch (err) {
                reject(err);
            }
        })
    }
    Processor.prototype.run = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                params = params || [];
                let option = {
                    sql: query
                };
                //default without db
                if (!configOrDbCon || configOrDbCon.password || configOrDbCon.database) {
                    let con = await this.connectToDb(configOrDbCon);
                    let results = await this.query(con, option, params);
                    return resolve(results);
                } else {
                    let con = configOrDbCon;
                    //process transaction
                    con.query(option, params, (err, results) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            resolve(results)
                        }
                    })
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    Processor.prototype.runIgnore = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                params = params || [];
                let option = {
                    sql: query
                };
                //default without db
                if (!configOrDbCon || configOrDbCon.password || configOrDbCon.database) {
                    let con = await this.connectToDb(configOrDbCon);
                    let results = await this.query(con, option, params);
                    return resolve(results);
                } else {
                    let con = configOrDbCon;
                    //process transaction
                    con.query(option, params, (err, results) => {
                        if (err) {
                            err.status = 409;
                            return resolve(err);
                        } else {
                            resolve(results);
                        }
                    })
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    Processor.prototype.scalar = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let results = await this.select(query, params, configOrDbCon);
                let array = new Array();
                for (let result of results) {
                    if (Object.keys(result).length == 1) {
                        array.push(result[Object.keys(result)[0]]);
                    } else {
                        return reject(new Error(`Scalar only Access Query with 1 result column!`))
                    }
                }
                resolve(array);
            } catch (err) {
                reject(err);
            }
        });
    }
    Processor.prototype.scalarFirst = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.selectFirst(query, params, configOrDbCon);
                if (result) {
                    if (Object.keys(result).length == 1) {
                        resolve(result[Object.keys(result)[0]]);
                    } else {
                        return reject(new Error(`Scalar only Access Query with 1 result column!`))
                    }
                } else {
                    resolve(null);
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    Processor.prototype.dbTime = async function (configOrDbCon) {
        let query = `select current_timestamp as time from DUAL`;

        return await this.scalarFirst(query, [], configOrDbCon);
    }
    Processor.prototype.upsert = function (table, dao, configOrDbCon, cols = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let daoProperties = Object.keys(dao);
                if (cols && !cols.every(c => daoProperties.includes(c))) {
                    let err = `DAO provided does not have field provided in field array`;
                    reject(err);
                }
                let params = [table, dao, dao];
                let query = `insert into ?? set ? on duplicate key update `;
                query += cols ? cols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(`, `) : `?`;
                let option = {
                    sql: query
                };
                //default without db
                if (!configOrDbCon || configOrDbCon.password || configOrDbCon.database) {
                    let con = await this.connectToDb(configOrDbCon);
                    let results = await this.query(con, option, params);
                    return resolve(results);
                } else {
                    let con = configOrDbCon;
                    //process transaction
                    con.query(option, params, (err, results) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            resolve(results)
                        }
                    })
                }
            } catch (err) {
                reject(err);
            }
        });
    }
    Processor.prototype.raw = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let option = {
                    sql: query, typeCast: RAW_TYPE_CAST
                };
                if (query.sql) {
                    option = query;
                }
                let results = await this.select(option, params, configOrDbCon);
                resolve(results);
            } catch (err) {
                reject(err);
            }
        })
    }
    Processor.prototype.rawFirst = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let option = {
                    sql: query, typeCast: RAW_TYPE_CAST
                };
                if (query.sql) {
                    option = query;
                }
                let results = await this.selectFirst(option, params, configOrDbCon);
                resolve(results);
            } catch (err) {
                reject(err);
            }
        })
    }
    Processor.prototype.sql = function (query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let connection = mysql.createConnection(configOrDbCon);
                connection.connect(function (err) {
                    if (err) {
                        return reject(err);
                    }
                    connection.query(query, params, (error, results) => {
                        if (error) {
                            connection.destroy();
                            return reject(error);
                        } else {
                            connection.destroy();
                            return resolve(results);
                        }
                    });
                });
            } catch (err) {
                reject(err);
            }
        })
    }

    Processor.prototype.bulkUpsert = function (table, daoArr, configOrDbCon, colArr = null, chunkSize = 10000) {
        return new Promise(async (resolve, reject) => {
            try {
                // check daoArr validity
                let colSet = new Set(Object.keys(daoArr[0]));
                let err = new Error(`DAO keys do not match`);
                err.status = 409;
                for (let dao of daoArr) {
                    let setSize = colSet.size;
                    let keys = Object.keys(dao);
                    if (setSize !== keys.length) reject(err);
                    keys.forEach(k => colSet.add(k));
                    if (colSet.size !== setSize) reject(err);
                }
                if (colArr && !colArr.every(c => colSet.has(c))) {
                    reject(err);
                }

                // generating parameters
                let cols = [...colSet.values()];
                let arr = daoArr.map(obj => cols.reduce((acc, cur) => acc.concat(obj[cur]), []));   // map each object to array of properties in the correct order using cols.reduce to form the array
                let updateQuery = colArr ? colArr.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(`, `) : cols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(`, `);
                let options = {
                    sql: `INSERT INTO ?? (??) VALUES ? ON DUPLICATE KEY UPDATE ${updateQuery}`
                }
                // let params = [table, cols, arr];

                // querying
                if (!configOrDbCon || configOrDbCon.password || configOrDbCon.database) {
                    let results = await upsertWithoutCon(table, cols, arr, chunkSize, options, this);
                    return resolve(results);
                } else {
                    let con = configOrDbCon;
                    let results;
                    let affectedRows = 0;
                    for (i = 0; i < arr.length; i += chunkSize) {
                        let params = [table, cols, arr.slice(i, i + chunkSize)];
                        results = await parseChunk(options, params, con);
                        affectedRows += results.affectedRows;
                    }
                    results.affectedRows = affectedRows;
                    resolve(results);
                }
            } catch (err) {
                reject(err);
            }
        })

        function upsertWithoutCon(table, cols, arr, chunkSize, options, qp) {
            return new Promise(async (resolve, reject) => {
                let con;
                try {
                    let results;
                    let affectedRows = 0;
                    con = await qp.connectWithTbegin();
                    for (i = 0; i < arr.length; i += chunkSize) {
                        let params = [table, cols, arr.slice(i, i + chunkSize)];
                        results = await qp.run(options.sql, params, con);
                        affectedRows += results.affectedRows;
                    }
                    results.affectedRows = affectedRows;
                    await qp.commitAndCloseConnection(con);

                    resolve(results);
                } catch (err) {
                    if (con) await qp.rollbackAndCloseConnection(con);
                    reject(err);
                }
            })
        }

        function parseChunk(options, params, con) {
            return new Promise(async (resolve, reject) => {
                try {
                    con.query(options, params, (err, results) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            resolve(results);
                        }
                    })
                } catch (err) {
                    return reject(err);
                }
            })
        }
    }
    Processor.prototype.bulkInsert = function (table, daoArr, isIgnore, configOrDbCon, colArr = null, chunkSize = 10000) {
        return new Promise(async (resolve, reject) => {
            try {
                // check daoArr validity
                let colSet = new Set(Object.keys(daoArr[0]));
                let err = new Error(`DAO keys do not match`);
                err.status = 409;
                for (let dao of daoArr) {
                    let setSize = colSet.size;
                    let keys = Object.keys(dao);
                    if (setSize !== keys.length) reject(err);
                    keys.forEach(k => colSet.add(k));
                    if (colSet.size !== setSize) reject(err);
                }
                if (colArr && !colArr.every(c => colSet.has(c))) {
                    reject(err);
                }

                // generating parameters
                let cols = [...colSet.values()];
                let arr = daoArr.map(obj => cols.reduce((acc, cur) => acc.concat(obj[cur]), []));   // map each object to array of properties in the correct order using cols.reduce to form the array
                let sql = isIgnore ? `INSERT IGNORE INTO ?? (??) VALUES ? ` : `INSERT INTO ?? (??) VALUES ? `;
                let options = {
                    sql: sql
                }
                // let params = [table, cols, arr];

                // querying
                if (!configOrDbCon || configOrDbCon.password || configOrDbCon.database) {
                    let results = await upsertWithoutCon(table, cols, arr, chunkSize, options, this);
                    return resolve(results);
                } else {
                    let con = configOrDbCon;
                    let results;
                    let affectedRows = 0;
                    for (i = 0; i < arr.length; i += chunkSize) {
                        let params = [table, cols, arr.slice(i, i + chunkSize)];
                        results = await parseChunk(options, params, con);
                        affectedRows += results.affectedRows;
                    }
                    results.affectedRows = affectedRows;
                    resolve(results);
                }
            } catch (err) {
                reject(err);
            }
        })

        function upsertWithoutCon(table, cols, arr, chunkSize, options, qp) {
            return new Promise(async (resolve, reject) => {
                let con;
                try {
                    let results;
                    let affectedRows = 0;
                    con = await qp.connectWithTbegin();
                    for (i = 0; i < arr.length; i += chunkSize) {
                        let params = [table, cols, arr.slice(i, i + chunkSize)];
                        results = await qp.run(options.sql, params, con);
                        affectedRows += results.affectedRows;
                    }
                    results.affectedRows = affectedRows;
                    await qp.commitAndCloseConnection(con);

                    resolve(results);
                } catch (err) {
                    if (con) await qp.rollbackAndCloseConnection(con);
                    reject(err);
                }
            })
        }

        function parseChunk(options, params, con) {
            return new Promise(async (resolve, reject) => {
                try {
                    con.query(options, params, (err, results) => {
                        if (err) {
                            err.status = 409;
                            return reject(err);
                        } else {
                            resolve(results);
                        }
                    })
                } catch (err) {
                    return reject(err);
                }
            })
        }
    }
    /**
     * Returns an array of active transactions
     */
    Processor.prototype.getActiveTransactions = function () {
        return Array.from(this.activeTransactions.entries()).map(t => { return { transactionId: t[0], startTime: t[1].startTime, con: t[1].con } });
    }

    Processor.prototype.getForeignKeys = function () {
        return new Promise(async (resolve, reject) => {
            try {
                let query = `SELECT TABLE_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA = ?`
                let results = await this.select(query, [this.database]);
                resolve(results);
            } catch (err) {
                reject(err);
            }
        })
    }

    Processor.prototype.getTables = function () {
        return new Promise(async (resolve, reject) => {
            try {
                let query = `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`;
                let results = await this.scalar(query, [this.database]);
                resolve(results);
            } catch (err) {
                reject(err);
            }
        })
    }

    /**
     * Returns array of tables in order of which to modify first
     */
    Processor.prototype.resolveDependencies = async function (tables = null) {
        try {
            let foreignKeys = await this.getForeignKeys();
            let dbTables = await this.getTables();

            // if no table supplied, default to all
            if (!tables || !tables.length) {
                tables = dbTables;
            }

            // build foreign key dependency graph
            let graph = new Map();
            for (let key of foreignKeys) {
                let node = graph.get(key.TABLE_NAME);
                if (!node) {
                    graph.set(key.TABLE_NAME, { name: key.TABLE_NAME, edges: [key.REFERENCED_TABLE_NAME] });
                } else {
                    node.edges.push(key.REFERENCED_TABLE_NAME);
                }
            }

            // adding the tables with no dependency
            for (let table of dbTables) {
                if (!graph.has(table)) {
                    graph.set(table, { name: table, edges: [] });
                }
            }

            // define array for final order and set of visited nodes
            let arr = [];
            let visited = new Set();

            for (let table of tables) {
                if (!dbTables.includes(table)) {
                    throw new Error(`Table ${table} not found in current schema`);
                }

                // traverse graph
                let currentNode = graph.get(table);
                if (!visited.has(table)) {
                    dep_resolve(currentNode, arr, visited);
                }
            }

            // graph traversal function, adapted from https://www.electricmonk.nl/docs/dependency_resolving_algorithm/dependency_resolving_algorithm.html
            function dep_resolve(node, arr, visited) {
                visited.add(node.name)
                for (let edge of node.edges) {
                    if (!arr.includes(edge)) {
                        if (visited.has(edge)) {
                            throw new Error(`Circular dependency found: ${node.name} references ${edge}`);
                        }
                        dep_resolve(graph.get(edge), arr, visited);
                    }
                }
                arr.push(node.name);
            }

            return arr;
        } catch (err) {
            throw err;
        }
    }
}
module.exports = qpV2;
