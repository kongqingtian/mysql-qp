let Processor = require('./1. abstract/qpAbstract');
require('./2. concrete/qpV1')(Processor);
require('./2. concrete/qpV2')(Processor);
require('./2. concrete/qpV3')(Processor);
require('./2. concrete/builder_cache')(Processor);
let processor = new Processor();

module.exports = processor;
