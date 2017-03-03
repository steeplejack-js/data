/**
 * Collection
 *
 * This is a collection of models.  Typically, this
 * would be multiple lines/documents out of a
 * database.  You will need to define a model and
 * it does the rest of it for you.
 */

/* Node modules */

/* Third-party modules */
import { Base, ValidationException } from '@steeplejack/core';
import { _ } from 'lodash';
import uuid from 'uuid';

/* Files */
import sorting from '../helpers/sorting';

const { sortAsc, sortDesc } = sorting;

export default class Collection extends Base {

  /**
   * To Models
   *
   * Creates an instance of the collection object and
   * populates it with the model.toModel method. This
   * can be used to convert a data store result into
   * a collection of models
   *
   * @param {Object[]} data
   * @returns {Collection}
   */
  static toModels (data = null) {
    /* Create a new instance of this collection with default data */
    const collection = new this();

    _.each(data, (item) => {
      if (_.isObject(item) && _.isEmpty(item) === false) {
        const model = collection.getModel().toModel(item);

        collection.addOne(model);
      }
    });

    return collection;
  }

  /**
   * Constructor
   *
   * Adds the data to the collection
   *
   * @param {Object[]} data
   */
  constructor (data = null) {
    /* istanbul ignore next */
    super();

    this._data = {};

    this._order = [];

    /* Add in anything passed in */
    this.add(data);
  }

  /**
   * Add
   *
   * Adds in the data to the collection
   *
   * @param {Object[]} data
   * @returns {Collection}
   */
  add (data = null) {
    /* Ensure we've got an array */
    if (_.isArray(data)) {
      _.each(data, (item) => {
        this.addOne(item);
      });
    }

    return this;
  }

  /**
   * Add One
   *
   * Adds one object to the collection
   *
   * @param {*} data
   * @returns {string}
   */
  addOne (data = null) {
    if (_.isObject(data) && _.isArray(data) === false) {
      let model;
      const ModelConstructor = this._model();

      if (data instanceof ModelConstructor) {
        /* It's already an instance of the model */
        model = data;
      } else {
        /* Convert the data into an instance of the model */
        model = new ModelConstructor(data);
      }

      /* Add to the collection */
      const id = uuid.v4();
      this._order.push(id);
      this._data[id] = model;

      this.emit('model_added', model, this._order.length - 1, id);

      return id;
    }

    return null;
  }

  /**
   * Each
   *
   * Cycles through each model in the collection and
   * runs the iterator function on it.
   *
   * @param {function} iterator
   * @param {object} thisArg
   * @returns {Collection}
   */
  each (iterator, thisArg = null) {
    if (_.isFunction(iterator) === false) {
      throw new TypeError('iterator must be a function');
    }

    const collection = this.getAll();

    _.each(collection, data => iterator.call(thisArg, data.model, data.id, collection));

    return this;
  }

  /**
   * Each Right
   *
   * Cycles through each model in the collection backwards
   * and runs the iterator function on it.
   *
   * @param {function} iterator
   * @param {object} thisArg
   * @returns {Collection}
   */
  eachRight (iterator, thisArg = null) {
    if (_.isFunction(iterator) === false) {
      throw new TypeError('iterator must be a function');
    }

    const collection = this.getAll();

    _.eachRight(collection, data => iterator.call(thisArg, data.model, data.id, collection));

    return this;
  }

  /**
   * Filter
   *
   * Anything that matches is removed from the
   * collection.  This is the opposite of where().
   *
   * @param {object} properties
   * @returns {Collection}
   */
  filter (properties) {
    this.each((model, id) => {
      if (model.where(properties)) {
        /* Remove this from the collection */
        this.removeById(id);
      }
    });

    return this;
  }

  /**
   * Find
   *
   * Similar to the where method, except that this
   * returns the first model that returns a match.
   * This may mean that there are additional things
   * that would match.
   *
   * @param {object} properties
   * @returns {null}
   */
  find (properties) {
    let result = null;

    this.each((model) => {
      if (result === null && model.where(properties)) {
        result = model;
      }
    });

    return result;
  }

  /**
   * Find Last
   *
   * Opposite of find method.  This performs a
   * reverse search on the collection, finding
   * the last matching model.
   *
   * @param {object} properties
   * @returns {Model}
   */
  findLast (properties) {
    let result = null;

    this.eachRight((model) => {
      if (result === null && model.where(properties)) {
        result = model;
      }
    });

    return result;
  }

  /**
   * Get All
   *
   * Returns the data array
   *
   * @returns {[]}
   */
  getAll () {
    return _.map(this._order, id => ({
      id,
      model: this._data[id],
    }));
  }

  /**
   * Get All By ID
   *
   * Gets all the models by matching the
   * ID
   *
   * @param ids
   * @returns {Model[]}
   */
  getAllById (ids) {
    /* Get the keys for the models */
    const keys = _.reduce(this.getAll(), (result, data, key) => {
      if (_.indexOf(ids, data.id) !== -1) {
        result.push(key);
      }

      return result;
    }, []);

    return this.getAllByKey(keys);
  }

  /**
   * Get All By Key
   *
   * Gets all the models from the collection with
   * the array keys.
   *
   * @param {number[]} id
   * @returns {Model[]}
   */
  getAllByKey (id) {
    return _.reduce(this.getAll(), (result, data, key) => {
      if (_.indexOf(id, key) !== -1) {
        result.push(data.model);
      }

      return result;
    }, []);
  }

  /**
   * Get All By Model
   *
   * Gets all the models by matching the model
   * instances themselves.
   *
   * @param {Model[]} models
   * @returns {Model[]}
   */
  getAllByModel (models) {
    /* Get the IDs for the models */
    const keys = _.reduce(this.getAll(), (result, data, key) => {
      if (_.indexOf(models, data.model) !== -1) {
        result.push(key);
      }

      return result;
    }, []);

    return this.getAllByKey(keys);
  }

  /**
   * Get By ID
   *
   * Search through the collection for the ID
   *
   * @param id
   * @returns {*}
   */
  getById (id) {
    const models = this.getAllById([
      id,
    ]);

    if (_.size(models) === 1) {
      return _.first(models);
    }

    return null;
  }

  /**
   * Get By Key
   *
   * Searches through the collection for the array
   * key.
   *
   * @param {number} id
   * @returns {Model}
   */
  getByKey (id) {
    const models = this.getAllByKey([
      id,
    ]);

    if (_.size(models) === 1) {
      return _.first(models);
    }

    return null;
  }

  /**
   * Get By Model
   *
   * Search through the collection for the model
   *
   * @param {Model} model
   * @returns {Model}
   */
  getByModel (model) {
    const models = this.getAllByModel([
      model,
    ]);

    if (_.size(models) === 1) {
      return models[0];
    }

    return null;
  }

  /**
   * Get Count
   *
   * Counts the number of items in the collection
   *
   * @returns {number}
   */
  getCount () {
    return _.size(this.getAll());
  }

  /**
   * Get Data
   *
   * Returns the models in order
   *
   * @param {boolean} parse
   * @returns {any[]}
   */
  getData (parse = undefined) {
    return _.map(this.getAll(), item => item.model.getData(parse));
  }

  /**
   * Get IDs
   *
   * Gets all the IDs in order
   *
   * @returns {string[]}
   */
  getIds () {
    return _.map(this.getAll(), item => item.id);
  }

  /**
   * Get Model
   *
   * Gets the model constructor
   *
   * @returns {Object}
   */
  getModel () {
    return this._model();
  }

  /**
   * Limit
   *
   * Limits in the same way as MySQL limits.  The first
   * is the limit, which is the maximum number of items
   * we can keep.  The second is the offset, which is
   * the number of items we pad.
   *
   * On a collection with 5 items, limit(2, 2) will
   * only keep the data at position 2 and 3, dropping
   * 0, 1 and 4 out.
   *
   * @param {number} limit
   * @param {number} offset
   * @returns {Collection}
   */
  limit (limit, offset = 0) {
    limit = Base.datatypes.setInt(limit, null);

    if (limit === null || limit < 0) {
      throw new TypeError('Collection.limit must be a positive integer');
    }

    if (limit === 0) {
      /* Get rid of everything */
      this.reset();
    } else if (limit < this.getCount()) {
      /* Get the keys in the data */
      const keys = this.getIds();

      /* Slice the keys */
      const endKey = limit + offset;

      /* Work out which keys to remove */
      const removeKeys = _.difference(keys, keys.slice(offset, endKey));

      _.each(removeKeys, (key) => {
        this.removeById(key);
      });
    }

    return this;
  }

  /**
   * Reset
   *
   * Resets the collection back to it's original (empty)
   * state
   *
   * @returns {boolean}
   */
  reset () {
    if (_.isEmpty(this._data)) {
      /* Nothing to do - it's already empty */
      return false;
    }

    this._data = {};
    this._order = [];

    return _.isEmpty(this._data);
  }

  /**
   * Remove By ID
   *
   * Removes the model by the ID
   *
   * @param {string} id
   * @returns {boolean}
   */
  removeById (id) {
    if (_.has(this._data, id)) {
      const model = this.getById(id);
      const position = _.indexOf(this._order, id);

      /* Delete the data */
      delete this._data[id];

      _.remove(this._order, orderId => orderId === id);

      this.emit('model_removed', model, position, id);

      return true;
    }

    return false;
  }

  /**
   * Remove By Model
   *
   * Removes the given model
   *
   * @param {Model} removeModel
   * @returns {boolean}
   */
  removeByModel (removeModel) {
    let removed = false;

    _.each(this._data, (model, id) => {
      if (removeModel === model) {
        removed = this.removeById(id);
      }
    });

    return removed;
  }

  /**
   * Sort
   *
   * Sort by the given sortation function. This
   * works in the same way as the Array.prototype.sort
   * method.
   *
   * @param {function} fn
   * @returns {Collection}
   */
  sort (fn) {
    if (_.isFunction(fn) === false) {
      throw new TypeError('Collection.sort must receive a function');
    }

    /* Get the array with everything */
    const sorted = this.getAll();

    /* Sort the array by the values */
    sorted.sort(fn);

    /* Change the order array */
    this._order = _.reduce(sorted, (result, data) => {
      result.push(data.id);

      return result;
    }, []);

    return this;
  }

  /**
   * Sort By
   *
   * This sorts by a key (or keys) in the model. The
   * params should be an object, with the key as the
   * key and the direction as the value.  The acceptable
   * direction values are "ASC" or "DESC".  This works
   * in broadly the same way as MySQLs sorting.
   *
   * @param {ISortProperty} properties
   * @returns {Collection}
   */
  sortBy (properties) {
    if (_.isPlainObject(properties) === false) {
      throw new TypeError('Collection.sortBy must receive an object of keys and directions');
    }

    /* Build a search object */
    const search = _.reduce(properties, (result, order, key) => {
      /* Default to ascending */
      result[key] = order.toUpperCase() === 'DESC' ? sortDesc : sortAsc;

      return result;
    }, {});

    /* Dispatch to the sort method */
    return this.sort((a, b) => {
      const keys = _.keys(search);
      const keyLength = keys.length;
      const forEnd = keyLength - 1;

      let sorted;

      for (let integer = 0; integer < keyLength; integer += 1) {
        /* Decide what we're searching by - go in search object order */
        const key = keys[integer];

        /* Get the value from the model */
        let value1 = a.model.get(key);
        let value2 = b.model.get(key);

        if (_.isString(value1)) {
          value1 = value1.toLowerCase();
        }
        if (_.isString(value2)) {
          value2 = value2.toLowerCase();
        }

        if (value1 === value2 && integer !== forEnd) {
          /* Equal and not final sort key - things to do */
          break;
        } else {
          sorted = search[key](value1, value2);
          break;
        }
      }

      return sorted;
    });
  }

  /**
   * To Db
   *
   * Returns the database representation of
   * the models in order
   *
   * @returns {TResult[]}
   */
  toDb () {
    return _.map(this.getAll(), item => item.model.toDb());
  }

  /**
   * Validate
   *
   * Validates all the models in the collection.
   *
   * @returns {boolean}
   */
  validate () {
    const collectionErr = new ValidationException('Collection validation error');

    _.each(this.getAll(), (item, id) => {
      try {
        item.model.validate();
      } catch (err) {
        _.each(err.getErrors(), (list, key) => {
          _.each(list, (error) => {
            collectionErr.addError(`${id}_${key}`, error.value, error.message, error.additional);
          });
        });
      }
    });

    if (collectionErr.hasErrors()) {
      throw collectionErr;
    }

    return true;
  }

  /**
   * Where
   *
   * Performs a where query on the collection.  Removes
   * anything that doesn't meet the criteria from the
   * collection.  This is the opposite of filter().
   *
   * @param {object} properties
   * @returns {Collection}
   */
  where (properties) {
    this.each((model, id) => {
      if (model.where(properties) === false) {
        /* Remove from the collection */
        this.removeById(id);
      }
    });

    return this;
  }

}
