'use strict';
const libPhoneNumber = require('libphonenumber-js');
/**
 * Extends the Joi library with some basic and common use cases.
 * */
module.exports = function extend(thorin, opt, Joi) {

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
      minDomainSegments: 2,
      maxDomainSegments: 10
    },
    ...opt
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
      scheme: ['https'],
      domain: {
        minDomainSegments: 2,
        maxDomainSegments: 10
      },
      ...opt
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


}
