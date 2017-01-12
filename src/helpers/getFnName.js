/**
 * Get Fn Name
 */

/* Node modules */

/* Third-party modules */
import { _ } from "lodash";

/* Files */

/**
 * Get Fn Name
 *
 * Gets the internal function name for extending
 * a setter/getter.
 *
 * Allows for setting of protected names with a
 * preceding underscore.
 *
 * @param {string} prefix
 * @param {string} keyName
 * @returns {string}
 */
module.exports = (prefix, keyName) => {
  keyName = _.capitalize(keyName);
  return prefix + keyName;
};
