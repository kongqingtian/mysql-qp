let qp = require('./qp');
let dev = { host: `dev.flex-solver.app`, user: 'qp_test', password: 'P@ssw0rd', database: `flexpos3`, limit: 2 };
let moment = require('moment');
// let local = { host: `localhost`, user: `root`, password: `admin`, database: `testdb`, limit: 2 };
qp.presetConnection(dev);

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateArr(number) {
    let people = [];
    for (i = 0; i < number; i++) {
        people.push({
            name: makeid(7),
            height: Math.floor(Math.random() * 200),
            weight: Math.floor(Math.random() * 80)
        })
    }
    return people;
}

async function todo(schemaName) {
    let con;
    try {
        qp.debug = true;
        con = await qp.connectWithTbegin();
        let tables = await qp.resolveDependencies();
        await qp.getCurrentTimestamp(con);
        // let gg = await qp.printConstructor(`queues`, con);
        gg = await qp.printBuilder(`queues`, con);
        let receipts = await qp.select(`select * from receipts`, [], con);
        let employee = await qp.selectFirst(`select * from employees`, [], con);
        let config = await qp.executeAndFetchFirstPromise(`select * from configs`);
        let gtoConfig = await qp.executeFirst(`select * from gtoconfig`, [], con);
        let queueMap = await qp.selectClassFirst(Queue, `select * from queues`, [], con);
        let builder = await qp.getBuilderSingleton(`queues`, con);

        let body = {
            queueNumber: `A123`, //varchar(45) & NO Null - 
            isAvailable: 1, //tinyint(1) & NO Null - 
            calledDatetime: `1990-01-01`, //timestamp & NO Null - 
            dismissedDatetime: `1990-01-01`, //timestamp & NO Null - 
            queueStatus: `1990-01-01`, //varchar(300) & NO Null - 
        };
        let dao = builder.construct(body);
        console.log(builder);
        await qp.commitAndCloseConnection(con);
    } catch (err) {
        await qp.rollbackAndCloseConnection(con);
        if (err.sql)
            console.log(err.sql);
        console.log(err);
    }
}


class Queue {
    constructor(dao) {
        if (typeof dao === 'object') {
            for (let key of Object.keys(dao)) {
                this[key] = dao[key];
            }
        }
    }
}

todo();