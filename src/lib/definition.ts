/**
 * Definition
 *
 * This is the definition of a model
 */

/* Node modules */

/* Third-party modules */
import {Base} from "@steeplejack/core";
import * as _ from "lodash";

/* Files */
import {IDefinitionValidation} from "../interfaces/definitionValidation";
import {IModelDefinition} from "../interfaces/modelDefinition";
import {Validation} from "./validation";

export class Definition implements IModelDefinition {

  /**
   * To Definition
   *
   * Factory method to create the definition object
   *
   * @param {string} name
   * @param {*} data
   * @returns {Definition}
   */
  public static toDefinition (name: string, data: any): Definition {

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

  public type: any;
  public value: any;
  public column: any;
  public primaryKey: boolean;
  public validation: IDefinitionValidation[];
  public enum: any[];
  public settings: any;

  public constructor (data: IModelDefinition = null) {

    let options: any = _.isObject(data) ? data : {};

    let type: any = null;
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
  public addValidation (rule: IDefinitionValidation[] = null): Definition {

    if (_.isArray(rule)) {

      _.each(rule, (item) => {

        let validateFn: any = Validation.generateFunction(item, this.value);

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
  public getSetting (setting: string): any {
    return this.settings[setting];
  }

  /**
   * Has Primary Key
   *
   * Does this definition have the primary key?
   *
   * @returns {boolean}
   */
  public hasPrimaryKey (): boolean {
    return this.primaryKey;
  }

}
