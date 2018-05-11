const e2c = require('electron-to-chromium');

module.exports = [
  'last 2 Chrome versions',
  'last 2 ChromeAndroid versions',
  'last 2 iOS major versions',
  e2c.electronToBrowserList('2.0'),
];
