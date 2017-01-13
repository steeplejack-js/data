/**
 * Definition
 *
 * This is the definition of a model
 */

/* Node modules */

/* Third-party modules */
import { Base } from "@steeplejack/core";
import { _ } from "lodash";

/* Files */
import Validation from './validation';

export default class Definition {

  /**
   * To Definition
   *
   * Factory method to create the definition object
   *
   * @param {string} name
   * @param {*} data
   * @returns {Definition}
   */
  static toDefinition (name, data) {

    return new Definition({
      column: data.column === null ? null : data.column || name,
      enum: data.enum,
      primaryKey: data.primaryKey,
      settings: data.settings,
      type: data.type,
      validation: data.validation,
      value: data.value,
    });

  }

  constructor (data = null) {

    let options = _.isObject(data) ? data : {};

    let type = null;
    if (_.isString(options.type) || _.isFunction(options.type)) {
      type = options.type;
    }

    this.type = type;
    this.value = _.isUndefined(options.value) ? null : _.cloneDeep(options.value);
    this.column = Base.datatypes.setString(options.column, null);
    this.primaryKey = Base.datatypes.setBool(options.primaryKey, false);
    this.validation = [];
    this.enum = Base.datatypes.setArray(options.enum, []);
    this.settings = Base.datatypes.setObject(options.settings, {});

    /* Add validations using the method */
    if (options.validation) {
      this.addValidation(options.validation);
    }

  }

  /**
   * Add Validation
   *
   * Adds a validation rule to the definition
   * object
   *
   * @param {Array|object} rule
   * @returns {Definition}
   */
  addValidation (rule = null) {

    if (_.isArray(rule)) {

      _.each(rule, item => {

        let validateFn = Validation.generateFunction(item, this.value);

        this.validation.push(validateFn);

      });

    }

    return this;

  }

  /**
   * Get Setting
   *
   * Returns the given setting parameter
   *
   * @param {string} setting
   * @returns {*}
   */
  getSetting (setting) {
    return this.settings[setting];
  }

  /**
   * Has Primary Key
   *
   * Does this definition have the primary key?
   *
   * @returns {boolean}
   */
  hasPrimaryKey () {
    return this.primaryKey;
  }

};
