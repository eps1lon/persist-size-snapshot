/* eslint-disable no-console */
const fse = require('fs-extra');
const path = require('path');
const { handler } = require('./');

['azure-event.json']
  .map(fixture => path.join(__dirname, '__fixtures__', fixture))
  .map(async fixturePath => {
    const event = await fse.readJSON(fixturePath);
    const response = await handler(event);

    console.log(response);
  })
  .map(promise => promise.catch(err => console.error(err)));
