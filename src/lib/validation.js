/**
 * Validation
 *
 * This adds validation to the Definition class
 */

/* Node modules */

/* Third-party modules */
import {_} from "lodash";

/* Files */
import Model from "./model";

export default class Validation {

  /**
   * Create Closure
   *
   * Creates a closure of the validation function.  This returns
   * another function with the parameters set as arguments so they
   * can be accessed.  In all cases, the first two arguments are
   * the instance of the model and the desired value to validate
   * against.
   *
   * @param {function} rule
   * @param {*} params
   * @param {*} defaultValue
   * @param {boolean} isRequired
   * @returns {function(Model, any): (boolean|*)}
   */
  static createClosure (rule, params, defaultValue, isRequired) {

    /* Create closure with params */
    return (value, model) => {

      if (value === defaultValue && isRequired === false) {
        /* Value is not set and not required - validate */
        return true;
      } else {

        /* Build the array to send to the rule */
        let input = [
          value,
          model,
        ];

        /* Are there any parameters? */
        if (_.isEmpty(params) === false) {
          input = input.concat(params);
        }

        /* Execute the function with the parameters */
        return rule(...input);

      }

    };

  }

  /**
   * Generate Function
   *
   * Creates the closure to validate the model
   * data
   *
   * @param {*} validate
   * @param {*} defaultValue
   */
  static generateFunction (validate, defaultValue = void 0) {

    if (_.isObject(validate) === false) {
      return null;
    }

    let rule = validate.rule;
    let required = false;
    let ruleFn;

    if (_.isFunction(rule)) {

      /* We're passing a custom function to validate against */
      ruleFn = rule;

    } else if (_.isString(rule)) {

      /* Treat the rule as a string */
      const ruleName = rule;

      /* Set the required status */
      required = ruleName.toUpperCase() === "REQUIRED";

      if (ruleName.toUpperCase() === "MATCH") {
        /* Use the special match rule */
        ruleFn = Validation.match;
      } else if (_.isFunction(Model.validation[ruleName])) {

        /* Valid rule in the validation utils package */
        ruleFn = (value, model, ...args) => {

          /* Add the value as first element */
          args.unshift(value);

          return Model.validation[ruleName](...args);

        };

      } else {
        /* The rule doesn't exist in the validation library */
        throw new SyntaxError(`'${rule}' is not a validation function`);
      }

    } else {

      throw new TypeError(`IDefinitionValidation.rule must be a function or a string, not a ${typeof rule}`);

    }

    /* Return the closure */
    return Validation.createClosure(ruleFn, validate.param, defaultValue, required);

  }

  /**
   * Match
   *
   * A special rule that matches the given value
   * against the value for the given key in the
   * model
   *
   * @param {*} value
   * @param {Model} model
   * @param {string} key
   * @returns {boolean}
   */
  static match (value, model, key) {

    const matchValue = model.get(key);

    if (matchValue !== value) {

      const err = new Error("VALUE_DOES_NOT_MATCH");
      err.key = key;
      err.value = value;
      err.params = [
        matchValue,
      ];

      throw err;

    }

    return true;

  }

}
