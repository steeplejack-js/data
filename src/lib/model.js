/**
 * Model
 *
 * This is a piece of data. Typically, this
 * would be a single line/document out of a
 * database. This requires a schema to be
 * defined.
 */

/* Node modules */

/* Third-party modules */
import { Base, ValidationException } from '@steeplejack/core';
import { _ } from 'lodash';

/* Files */
import dataCasting from '../helpers/dataCasting';
import getFnName from '../helpers/getFnName';
import scalarValues from '../helpers/scalarValues';
import Definition from './definition';

export default class Model extends Base {

  /**
   * Merge
   *
   * Wraps the lodash defaultsDeep method. This
   * exists purely as a helper method so that
   * any user can merge their schema objects
   * without having to have lodash as a dependency.
   *
   * @param {*} object
   * @param {*} sources
   * @returns {*}
   */
  static merge (object, ...sources) {
    return _.defaultsDeep(object, ...sources);
  }

  /**
   * To Model
   *
   * Converts an object literal to an instance
   * of this model. This will be expecting the
   * data in the same format that is returned
   * from the toDb() method
   *
   * @param {*} data
   * @returns {Model}
   */
  static toModel (data = {}) {
    /* Create a new instance of this model with default data */
    const model = new this();

    const definition = model.getColumnKeys();

    /* Set the column data to the model */
    _.each(definition, (item) => {
      const key = item.key;
      let value = data[item.column];
      const modelDefinition = model.getDefinition(key);
      const type = modelDefinition.type;

      if (value !== modelDefinition.value && value !== undefined) {
        if (_.isFunction(type.toModels)) {
          /* It's a collection */
          value = type.toModels(value).getData();
        } else if (_.isFunction(type.toModel)) {
          /* It's a model */
          value = type.toModel(value).getData();
        }
      }

      /* Set the data to the model */
      model.set(key, value);
    });

    return model;
  }


  /**
   * Constructor
   *
   * @param {object} data
   */
  constructor (data = {}) {
    /* istanbul ignore next */
    super();

    /*
     This is where the raw model data lives. Ignore
     this and use the get/set methods to access
     it.
    */
    this._data = {};

    /* This is your definition objects that control how the model behaves */
    this._definition = {};

    /* Defines the primary key on the model. This is optional */
    this._primaryKey = null;

    this._configureDefinition();

    /* Set the data to the model */
    _.each(data, (value, key) => {
      this[key] = value;
    });
  }

  /**
   * Get
   *
   * Returns the data set to the key name
   *
   * @param {string} key
   * @returns {*}
   */
  get (key) {
    /* Look for a method first */
    const customFunc = getFnName('_get', key);

    /* Get the current value */
    const currentValue = (_.has(this._data, key)) ? this._data[key] : undefined;

    if (_.isFunction(this[customFunc])) {
      /* Use the custom function */
      return this[customFunc](currentValue);
    }
    /* Just return the value */
    return currentValue;
  }

  /**
   * Get Column Keys
   *
   * Gets the keys and the column name
   * as an array of objects
   *
   * @returns {*[]}
   */
  getColumnKeys () {
    return _.reduce(this._definition, (result, definition, key) => {
      result.push({
        column: definition.column,
        key,
      });

      return result;
    }, []);
  }

  /**
   * Get Data
   *
   * Returns the data that is set to this
   * data model.
   *
   * This allows us to access the static
   * property set in the child.
   *
   * If parsing the data, it will run it
   * through any getter functions. Otherwise,
   * it will just be the raw data.
   *
   * @param {boolean} parse
   * @returns {*}
   */
  getData (parse = true) {
    return _.reduce(this._data, (result, data, key) => {
      if (_.isObject(data) && _.isFunction(data.getData)) {
        data = data.getData();
      } else if (parse) {
        data = this.get(key);
      }

      result[key] = data;

      return result;
    }, {});
  }

  /**
   * Get Definition
   *
   * Once the schema has been converted into
   * a series of Definition objects, they will
   * live in here.
   *
   * @param {string} key
   * @returns {Definition|null}
   */
  getDefinition (key) {
    return this._definition[key] || null;
  }

  /**
   * Get Primary Key
   *
   * Gets the primary key
   *
   * @return {string}
   */
  getPrimaryKey () {
    return this._primaryKey;
  }

  /**
   * Get Primary Key Value
   *
   * Gets the value of the primary key
   *
   * @returns {*}
   */
  getPrimaryKeyValue () {
    return this.get(this.getPrimaryKey());
  }

  /**
   * Get Schema
   *
   * Gets the schema from the child class.
   * This is the unparsed version.
   *
   * @returns {*}
   */
  getSchema () {
    return this._schema() || {};
  }

  /**
   * Set
   *
   * Sets data to the desired key. If no value is
   * received, it will set the default value.
   *
   * If there is a method called _setKey (eg, if
   * key = "item", method called _setItem) on the
   * concrete class, that will act as the setter.
   * Otherwise, it uses simple datatype rules.
   *
   * @param {string} key
   * @param {*} value
   * @returns {Model}
   */
  set (key, value = undefined) {
    const definition = this.getDefinition(key);

    if (definition === null) {
      /* We don't know this key here */
      return this;
    }

    const customFunc = getFnName('_set', key);
    const defaultValue = definition.value;

    if (_.isFunction(this[customFunc])) {
      value = this._setCustomFunction(customFunc, value, defaultValue);
    } else {
      const type = definition.type;

      /* Is the type a class? */
      if (_.isFunction(type)) {
        /* Yup - is it already instance of the type? */
        value = this._setStandardFunction(type, value, defaultValue);
      } else {
        /* No - treat as string */
        value = this._setStringFunction(type, value, defaultValue, definition);
      }
    }

    this._data[key] = value;

    return this;
  }

  /**
   * To Db
   *
   * Converts the model to the database
   * representation object. This is an
   * object literal
   *
   * @returns {*}
   */
  toDb () {
    return _.reduce(this._definition, (result, definition, key) => {
      /* Get the column name */
      const column = definition.column;

      /* Ignore null columns */
      if (column !== null) {
        let data = this[key];

        /* If it's an instance of the model, get the DB representation */
        if (_.isObject(data) && _.isFunction(data.toDb)) {
          data = data.toDb();
        }

        result[column] = data;
      }

      return result;
    }, {});
  }

  /**
   * Validate
   *
   * Validates the model against the validation
   * rules.  It throws an error if it detects a
   * violation of the rules. If the validation
   * succeeds, it returns true.
   *
   * @returns {boolean}
   */
  validate () {
    /* Create a validation error - will put any errors here */
    const validation = new ValidationException('Model validation error');

    /* Run through each of the definitions for the validation rules */
    _.each(this._definition, (definition, key) => {
      /* Get the current value */
      const value = this.get(key);

      if (_.isObject(value) && _.isFunction(value.validate)) {
        /* Collection or Model - validate that */
        try {
          value.validate();
        } catch (err) {
          _.each(err.getErrors(), (list, errKey) => {
            _.each(list, (error) => {
              const name = [
                key,
                errKey,
              ].join('_');

              validation.addError(name, error.value, error.message, error.additional);
            });
          });
        }
      }

      /* Cycle through the validation rules */
      _.each(definition.validation, (rule) => {
        try {
          /* A validation function can throw error or return false */
          if (rule(value, this) === false) {
            /* Returned false - throw a simple error */
            throw new Error('Custom model validation failed');
          }
        } catch (err) {
          /* Add the validation error */
          validation.addError(key, value, err.message, err.params);
        }
      });
    });

    if (validation.hasErrors()) {
      /* Uh-oh, there's an error */
      throw validation;
    }

    /* Return true to show we're happy */
    return true;
  }

  /**
   * Where
   *
   * Give it some properties and see if the model
   * matches those values.
   *
   * If the data is an object, it casts the data
   * to a string so that it can be matched.
   *
   * @param {object} properties
   * @returns {boolean}
   */
  where (properties) {
    /* Throw error if non-object */
    if (_.isPlainObject(properties) === false) {
      throw new TypeError('Model.where properties must be an object');
    }

    /* If there are no properties set, always return false */
    if (_.isEmpty(properties)) {
      return false;
    }

    /* Clone the model so we can use the setter without breaking the references */
    const tmp = this.clone();

    /* Create a target object - the values we want to check */
    const target = _.reduce(properties, (result, value, key) => {
      /* Set the value to the model so in the right format */
      tmp.set(key, value);

      value = scalarValues(tmp.get(key));

      result[key] = value;

      return result;
    }, {});

    /* Get the current values for each of the properties */
    const current = _.reduce(properties, (result, value, key) => {
      value = scalarValues(this.get(key));

      result[key] = value;

      return result;
    }, {});

    return _.isEqual(current, target);
  }

  /**
   * Configure Definition
   *
   * Takes the schema and converts it to a
   * definition object
   *
   * @private
   */
  _configureDefinition () {
    /* Written like this (not with _.reduce) as the setter needs to access the definition */
    _.each(this.getSchema(), (schemaItem, key) => {
      const definition = Definition.toDefinition(key, schemaItem);

      if (definition.hasPrimaryKey()) {
        this._setPrimaryKey(key);
      }

      /* Set the definition to the class */
      this._definition[key] = definition;

      /* Create the setters and getters */
      Object.defineProperty(this, key, {
        configurable: false,
        enumerable: true,
        get: () => this.get(key),
        set: value => this.set(key, value),
      });

      /* Set the default value */
      this[key] = undefined;
    });
  }

  /**
   * Merge Schemas
   *
   * Helper to merge together two schemas
   *
   * @param {object} parent
   * @param {object} child
   * @returns {Object}
   * @private
   */
  _mergeSchemas (parent, child) {
    return _.extend(parent, child);
  }

  /**
   * Set Custom Function
   *
   * This is setting a function which is already set
   * to this instance of the class
   *
   * @param {string} customFunc
   * @param {*} value
   * @param {*} defaultValue
   * @returns {*}
   * @private
   */
  _setCustomFunction (customFunc, value, defaultValue) {
    value = this[customFunc](value, defaultValue);

    if (_.isUndefined(value)) {
      value = defaultValue;
    }

    return value;
  }

  /**
   * Set Primary Key
   *
   * Sets the primary key
   *
   * @param {string} key
   * @private
   */
  _setPrimaryKey (key) {
    if (this.getPrimaryKey() === null) {
      this._primaryKey = key;
    } else {
      throw new Error('CANNOT_SET_MULTIPLE_PRIMARY_KEYS');
    }
  }

  /**
   * Set Standard Function
   *
   * This is setting a standard function which actually
   * a function
   *
   * @param {function} Type
   * @param {*} value
   * @param {*} defaultValue
   * @returns {*}
   * @private
   */
  _setStandardFunction (Type, value, defaultValue) {
    if (value instanceof Type === false) {
      /* No - populate the instance if something set */
      let createNew = false;

      if (_.isArray(value)) {
        createNew = true;
      } else {
        value = Base.datatypes.setObject(value, defaultValue);
        createNew = value !== defaultValue;
      }

      if (createNew) {
        value = new Type(value);
      }
    }

    return value;
  }

  /**
   * Set String Function
   *
   * We're setting a function that's a description
   * of how we want to set it
   *
   * @param {string} type
   * @param {*} value
   * @param {*} defaultValue
   * @param {*} definition
   * @returns {*}
   * @private
   */
  _setStringFunction (type, value, defaultValue, definition) {
    switch (type) {

      case 'enum':
        value = Base.datatypes.setEnum(value, definition.enum, defaultValue);
        break;

      case 'mixed':
        if (_.isUndefined(value)) {
          value = defaultValue;
        }
        break;

      default:
        if (_.has(dataCasting, type)) {
          const fnName = dataCasting[type];
          const fn = Base.datatypes[fnName];

          value = fn(value, defaultValue);
        } else {
          /* Unknown datatype */
          throw new TypeError(`Definition.type '${type}' is not valid`);
        }
        break;
    }

    return value;
  }

}
