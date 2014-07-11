/**
 * Merges set of properties on a object
 * Useful for constructor defaults/options
 */
function merge(object, defaults, updates) {
  updates = updates || {};
  for(var o in defaults) {
    if (defaults.hasOwnProperty(o)) {
      object[o] = updates[o] || defaults[o];
    }
  }
}

/**
 * Prototype inheritance helper
 */
function inherit(Sub, Super) {
  for (var key in Super) {
    if (Super.hasOwnProperty(key)) {
      Sub[key] = Super[key];
    }
  }
  Sub.prototype = new Super();
  Sub.constructor = Sub;
}
