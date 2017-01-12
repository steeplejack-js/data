/**
 * Sorting
 *
 * Sorting functions
 */

/* Node modules */

/* Third-party modules */

/* Files */

/**
 * Sort ASC
 *
 * Allows sorting in ascending order
 *
 * @param {*} a
 * @param {*} b
 * @returns {number}
 */
const sortAsc = (a, b) => {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
};

/**
 * Sort DESC
 *
 * Allows sorting in descending order
 *
 * @param {*} a
 * @param {*} b
 * @returns {number}
 */
const sortDesc = (a, b) => {
  if (a < b) {
    return 1;
  } else if (a > b) {
    return -1;
  } else {
    return 0;
  }
};

module.exports = {
  sortAsc,
  sortDesc
};
