# Thorin.js request session utility

## Full documentation available at https://thorinjs.com

### Plugin specific documentation available at https://thorinjs.com/plugin/sentry

### Usage

```javascript
'use strict';
const thorin = require('thorin');

thorin.addPlugin(require('thorin-plugin-joi'));

thorin.run(async () => {
  const joiObj = thorin.plugin('joi'),
    Joi = joiObj.Joi;

  const schema = joiObj.schema(() => Joi.object({
    domain: Joi.domain().optional()
  }));
  try {
    const unvalidatedData = {
      my: 'data',
      domain: 'john.com'
    }
    const result = await joiObj.validate(schema, unvalidatedData);
    console.log(result, unvalidatedData);
  } catch (e) {
    console.log(e, e.data.fields);
  }
})

```
