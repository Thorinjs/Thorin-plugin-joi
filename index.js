'use strict';
const initJoi = require('./lib/joi');
/**
 *
 */
module.exports = function (thorin, opt, pluginName = 'joi') {
  let joiObj;
  opt = thorin.util.extend({
    logger: pluginName || 'joi',
    store: 'sql',   // in the event that we use Joi.modelId()
    opt: {
      abortEarly: false,
      convert: true,
      noDefaults: false,
      allowUnknown: true,
      stripUnknown: true,
      presence: 'required',
      errors: {
        wrap: {
          label: ''
        }
      }
    }                   // Additional Joi.dev options. See  https://joi.dev/api/
  }, opt);
  thorin.config(`plugin.${pluginName}`, opt);
  joiObj = initJoi(thorin, opt);
  return joiObj;
};
module.exports.publicName = 'joi';
