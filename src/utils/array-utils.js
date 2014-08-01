/**
 * Converts an array-like object (i.e. NodeList) to Array
 * Note: could just use Array.prototype.slice but does not work in IE <= 8
 */
function toArray(obj) {
  var array = [],
      i = obj.length >>> 0; // cast to Uint32
  while (i--) {
    array[i] = obj[i];
  }
  return array;
}

/**
 * Computes the sum of values in a (sparse) array
 */
function sumSparseArray(array) {
  var sum = 0, i, num;
  for (i in array) { // 'for in' best for sparse arrays
    sum += array[i];
  }
  return sum;
}

export { toArray, sumSparseArray };