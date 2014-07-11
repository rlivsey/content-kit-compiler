/**
 * Converts an array-like object (i.e. NodeList) to Array
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
 * Computes the sum of values in an array
 */
function sumArray(array) {
  var sum = 0, i, num;
  for (i in array) { // 'for in' best for sparse arrays
    sum += array[i];
  }
  return sum;
}
