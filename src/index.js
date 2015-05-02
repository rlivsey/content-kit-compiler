import Compiler from './compiler';
import ContentKit from './main';

if (typeof exports === 'object') {
  module.exports = Compiler;
} else {
  window.ContentKit = ContentKit;
}
