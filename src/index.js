import ContentKit from './main';

if (typeof exports === 'object') {
  module.exports = ContentKit;
} else {
  window.ContentKit = ContentKit;
}
