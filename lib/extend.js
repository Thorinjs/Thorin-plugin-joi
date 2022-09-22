'use strict';
const libPhoneNumber = require('libphonenumber-js');
/**
 * Extends the Joi library with some basic and common use cases.
 * */
module.exports = function extend(thorin, opt, Joi) {
  const storeObj = thorin.store(opt.store), logger = thorin.logger(opt.logger);

  /**
   * Usage: Joi.enum(['ONE','TWO']) or Joi.enum({ONE:'one',TWO:'two'})
   * Validates: value is a string and  is one of the given enum values.
   * */
  Joi.enum = (values = []) => {
    let arr = [];
    if (values instanceof Array) {
      arr = values;
    } else if (typeof values === 'object' && values) {
      arr = Object.keys(values);
    }
    let s = Joi.string();
    return s.valid.apply(s, arr);
  };

  /**
   * Usage:
   *  Joi.url()
   *  Validates: value is a publicly accessible URL
   * */
  Joi.url = (opt = {}) => Joi.string().uri({
    scheme: ['http', 'https'], domain: {
      minDomainSegments: 2, maxDomainSegments: 10
    }, ...opt
  }).messages({
    any: 'Please provide a valid URL'
  });

  /**
   * Usage: Joi.domain()
   * Validates: value is a domain with a valid TLD.
   * */
  Joi.domain = (opt = {}) => {
    return Joi.string().custom((value, helper) => {
      try {
        if (value.indexOf('://') !== -1) value = value.split('://')[1];
        value = value.split('?')[0].split('/')[0];
        if (value.substr(0, 4) === 'www.') value = value.substr(4);
        return 'https://' + value.toLowerCase();
      } catch (e) {
        return helper.message({
          custom: 'Please provide a valid domain'
        });
      }
    }).uri({
      scheme: ['https'], domain: {
        minDomainSegments: 2, maxDomainSegments: 10
      }, ...opt
    }).custom((value, helper) => {
      try {
        value = value.split('://')[1];
        return value;
      } catch (e) {
        return helper.message({
          custom: 'Please provide a valid domain'
        });
      }
    })
  };

  /**
   * Usage: Joi.email()
   * Validates: value is an email string
   * */
  Joi.email = (opt = {}) => {
    return Joi.string(opt).email().lowercase();
  };

  /**
   * Usage: Joi.phoneNumber()
   * Validates: value is a phone number with international format
   * */
  Joi.phoneNumber = (opt = {}) => {
    return Joi.string(opt).min(6).max(20).custom((value, helper) => {
      try {
        if (value.substr(0, 2) === '00') {
          value = '+' + value.substr(2);
        } else if (value.charAt(0) !== '+') value = `+${value}`;
        let v = libPhoneNumber.parsePhoneNumber(value);
        if (!v || !v.isValid()) throw 1;
        return v.number;
      } catch (e) {
        return helper.message({
          custom: 'Please provide a valid phone number'
        });
      }
    }).messages({
      any: 'Please provide a valid phone number'
    });
  };

  /**
   * Usage: Joi.id()
   * Validates: value is a string with 30-33 length, or value is a number.
   * */
  Joi.id = (opt = {}) => {
    return Joi.alternatives().try(Joi.string(opt).min(30).max(33), Joi.number().min(0));
  };

  /**
   * Usage: Joi.modelId(modelName, opt={})
   * Validates: that the given string is the same type of the given SQL Store's model.
   * Eg: Joi.modelId('user', { required: false })
   * @Options:
   *  - opt.allowNull - if set to false, accepts a null value as well.
   *  - opt.field - if set, the field name to use for validation. Defaults to "id"
   * */
  Joi.modelId = (modelName, opt = {}) => {
    const {
      allowNull = false,
      field = 'id'
    } = opt;
    if (!storeObj) {
      logger.warn(`Store ${opt.store} not loaded for Joi.modelId(${modelName}`);
      throw thorin.error('DATA.INVALID', `Validation for ${modelName} not loaded`);
    }
    const Model = typeof modelName === 'string' ? storeObj.model(modelName.trim()) : modelName;
    if (!Model || (typeof Model !== 'object' && typeof Model !== 'function')) {
      logger.warn(`Model ${modelName} is not a valid store model`);
      throw thorin.error('DATA.INVALID', `Validation for model not loaded`);
    }
    const Field = Model.attributes[field];
    if (!Field) {
      logger.warn(`Model ${Model.name} does not have field [${field}]`);
      throw thorin.error('DATA.INVALID', `Validation field for model not loaded`);
    }
    if (Field.references && Field.references.model) {
      return Joi.modelId(Field.references.model, {
        ...opt,
        field: Field.references.key
      });
    }
    let fieldType = (Field.type.name || Field.type.constructor.name || 'STRING').toUpperCase();
    let joiCheck;
    let errorMessage = `Please provide a valid ${Model.name} ${field}`;
    if (['INTEGER', 'BIGINT', 'FLOAT', 'DOUBLE', 'REAL', 'DECIMAL'].indexOf(fieldType) !== -1) {
      let num = Joi.number().positive(),
        str = Joi.string().regex(/^\d+$/).custom((value) => {
          if (fieldType === 'INTEGER') return parseInt(value);
          return parseFloat(value);
        });
      if (fieldType === 'INTEGER') num = num.integer();
      let alts = [num, str];
      if (allowNull) {
        alts.push(null);
      }
      joiCheck = Joi.alternatives(alts);
      joiCheck = joiCheck.messages({
        'string.pattern.base': errorMessage,
        'alternatives.types': errorMessage
      });
    } else {
      joiCheck = Joi.string();
      if (allowNull) joiCheck = joiCheck.allow(null);
      if (Field.type.options?.length) {
        if (Field.prefix) {
          joiCheck = joiCheck.length(Field.type.options.length);
        } else {
          joiCheck = joiCheck.max(Field.type.options.length).min(Field.type.options.length - 4);
        }
      }
      if (Field.prefix) {
        const uuidRegex = /^[a-z0-9]+$/i;
        joiCheck = joiCheck.custom((value, helper) => {
          if (value.substr(0, Field.prefix.length) !== Field.prefix) {
            return helper.message({
              custom: errorMessage
            });
          }
          let res = value.substr(Field.prefix.length);
          if (!uuidRegex.test(res)) {
            return helper.message({
              custom: errorMessage
            });
          }
          return value;
        });
      }
    }
    return joiCheck;
  }


}
