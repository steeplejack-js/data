/**
 * Scalar Values
 *
 * Converts objects to scalar values
 */

/* Node modules */

/* Third-party modules */
import { _ } from "lodash";

/* Files */

/**
 * Scalar Values
 *
 * Converts the objects to scalar values for
 * matching purposes
 *
 * @param {*} value
 * @returns {*}
 */
export default value => {

  if (_.isObject(value)) {
    /* Set objects to strings */
    if (_.isDate(value)) {
      value = value.toISOString();
    } else {
      value = JSON.stringify(value);
    }
  }

  return value;

};
