/**
 * collection.test
 */

/* Node modules */

/* Third-party modules */
import * as _ from "lodash";
import * as uuid from "node-uuid";
import {Base, ValidationException} from "@steeplejack/core";

/* Files */
import {expect, sinon} from "../../helpers/configure";
import {Definition} from "../../../lib/definition";
import {Model} from "../../../lib/model";
import {Collection} from "../../../lib/collection";
import {ICollectionData} from "../../../interfaces/collectionData";

const UUID_V4 = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

describe("Collection test", function () {

  let def: any;
  beforeEach(function () {

    class Child extends Model {
      protected _schema () {
        return {
          boolean: {
            type: "boolean",
            value: false
          },
          datetime: {
            type: "date"
          },
          float: {
            type: "float"
          },
          integer: {
            type: "integer",
            column: "int"
          },
          string: {
            type: "string"
          }
        };
      }
    }

    class Children extends Collection {
      protected _model () {
        return Child;
      }
    }

    def = new Children([
      {
        boolean: "true",
        datetime: "2010-02-07",
        float: "2.2",
        integer: "2",
        string: "string"
      },
      {
        boolean: "true",
        datetime: "2010-02-08",
        float: "2.3",
        integer: "2",
        string: "string"
      },
      {
        boolean: "true",
        datetime: "2010-02-09",
        float: "2.3",
        integer: "2",
        string: "string"
      }
    ]);

    expect(def.getCount()).to.be.equal(3);

    this.Child = Child;
    this.Children = Children;

  });

  describe("Methods", function () {

    describe("#constructor", function () {

      it("should be cheerful when it doesn't receive an data", function () {

        var obj = new this.Children();

        expect(obj).to.be.instanceof(Collection)
          .instanceof(this.Children)
          .instanceof(Base);
        expect(obj.getCount()).to.be.equal(0);

        expect(obj.getAll()).to.be.an("array")
          .to.have.length(0);

      });

      it("should create a collection of models from an object literal", function () {

        var obj = new this.Children([{
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        }, {
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        }]);

        expect(obj).to.be.instanceof(Collection)
          .instanceof(this.Children)
          .instanceof(Base);
        expect(obj.getCount()).to.be.equal(2);

        expect(obj.getAll()).to.be.an("array")
          .to.have.length(2);
        expect(obj.getAll()[0]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[0].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[0].model).to.be.eql(new this.Child({
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        }));

        expect(obj.getAll()[1]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[1].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[1].model).to.be.eql(new this.Child({
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        }));

      });

      it("should create a collection of models from an model instance", function () {

        let model = new this.Child({
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        });

        var obj = new this.Children([model]);

        expect(obj).to.be.instanceof(Collection)
          .instanceof(this.Children)
          .instanceof(Base);
        expect(obj.getCount()).to.be.equal(1);

        expect(obj.getAll()).to.be.an("array")
          .to.have.length(1);
        expect(obj.getAll()[0]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[0].id).to.be.a("string");
        expect(obj.getAll()[0].model).to.be.equal(model);

      });

    });

    describe("#add", function () {

      let obj: any;
      beforeEach(function () {
        obj = new this.Children();

        this.emitSpy = sinon.spy(obj, "emit");

        expect(obj.getCount()).to.be.equal(0);
        expect(obj.getAll()).to.be.eql([]);
      });

      it("should add many plain objects and convert to the models", function () {

        let model1 = {
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        };

        let model2 = {
          boolean: "false",
          datetime: "2011-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        };

        expect(obj.add([
          model1,
          model2
        ])).to.be.equal(obj);

        expect(obj.getCount()).to.be.equal(2);
        expect(obj.getAll()).to.be.an("array")
          .to.have.length(2);
        expect(obj.getAll()[0]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[0].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[0].model).to.be.eql(new this.Child(model1));

        expect(obj.getAll()[1]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[1].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[1].model).to.be.eql(new this.Child(model2));

        expect(this.emitSpy).to.be.calledTwice
          .calledWithExactly("model_added", obj.getByKey(0), 0, obj.getAll()[0].id)
          .calledWithExactly("model_added", obj.getByKey(1), 1, obj.getAll()[1].id);

      });

      it("should add many model instances and keep same equality", function () {

        let model1 = new this.Child({
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        });

        let model2 = new this.Child({
          boolean: "false",
          datetime: "2011-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        });

        expect(obj.add([
          model1,
          model2
        ])).to.be.equal(obj);

        expect(obj.getCount()).to.be.equal(2);
        expect(obj.getAll()).to.be.an("array")
          .to.have.length(2);
        expect(obj.getAll()[0]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[0].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[0].model).to.be.equal(model1);

        expect(obj.getAll()[1]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[1].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[1].model).to.be.equal(model2);

        expect(this.emitSpy).to.be.calledTwice
          .calledWithExactly("model_added", obj.getByKey(0), 0, obj.getAll()[0].id)
          .calledWithExactly("model_added", obj.getByKey(1), 1, obj.getAll()[1].id);


      });

      it("should ignore any non-arrays", function () {

        expect(obj.add({
          boolean: true
        })).to.be.equal(obj);

        expect(obj.getCount()).to.be.equal(0);

        expect(obj.add()).to.be.equal(obj);

        expect(obj.getCount()).to.be.equal(0);

        expect(this.emitSpy).to.not.be.called;

      });

    });

    describe("#addOne", function () {

      let obj: any;
      beforeEach(function () {
        obj = new this.Children();

        this.emitSpy = sinon.spy(obj, "emit");

        expect(obj.getCount()).to.be.equal(0);
        expect(obj.getAll()).to.be.eql([]);
      });

      it("should add many plain objects and convert to the models", function () {

        let model1 = {
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        };

        let model2 = {
          boolean: "false",
          datetime: "2011-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        };

        expect(obj.addOne(model1)).to.be.equal(obj.getAll()[0].id);

        expect(obj.getCount()).to.be.equal(1);
        expect(obj.getAll()).to.be.an("array")
          .to.have.length(1);
        expect(obj.getAll()[0]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[0].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[0].model).to.be.eql(new this.Child(model1));

        expect(this.emitSpy).to.be.calledOnce
          .calledWithExactly("model_added", obj.getByKey(0), 0, obj.getAll()[0].id);

        expect(obj.addOne(model2)).to.be.equal(obj.getAll()[1].id);

        expect(obj.getCount()).to.be.equal(2);
        expect(obj.getAll()).to.be.an("array")
          .to.have.length(2);
        expect(obj.getAll()[1]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[1].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[1].model).to.be.eql(new this.Child(model2));

        expect(this.emitSpy).to.be.calledTwice
          .calledWithExactly("model_added", obj.getByKey(0), 0, obj.getAll()[0].id)
          .calledWithExactly("model_added", obj.getByKey(1), 1, obj.getAll()[1].id);

      });

      it("should add many model instances and keep same equality", function () {

        let model1 = new this.Child({
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        });

        let model2 = new this.Child({
          boolean: "false",
          datetime: "2011-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        });

        expect(obj.addOne(model1)).to.be.equal(obj.getAll()[0].id);

        expect(obj.getCount()).to.be.equal(1);
        expect(obj.getAll()).to.be.an("array")
          .to.have.length(1);
        expect(obj.getAll()[0]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[0].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[0].model).to.be.equal(model1);

        expect(this.emitSpy).to.be.calledOnce
          .calledWithExactly("model_added", obj.getByKey(0), 0, obj.getAll()[0].id);

        expect(obj.addOne(model2)).to.be.equal(obj.getAll()[1].id);

        expect(obj.getCount()).to.be.equal(2);
        expect(obj.getAll()).to.be.an("array")
          .to.have.length(2);
        expect(obj.getAll()[1]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[1].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[1].model).to.be.equal(model2);

        expect(this.emitSpy).to.be.calledTwice
          .calledWithExactly("model_added", obj.getByKey(0), 0, obj.getAll()[0].id)
          .calledWithExactly("model_added", obj.getByKey(1), 1, obj.getAll()[1].id);


      });

      it("should ignore any non-objects", function () {

        expect(obj.addOne([{
          boolean: true
        }])).to.be.null;

        expect(obj.getCount()).to.be.equal(0);

        expect(obj.addOne()).to.be.null;

        expect(obj.getCount()).to.be.equal(0);

        expect(this.emitSpy).to.not.be.called;

      });

    });

    describe("#each", function () {

      it("should run the each method", function () {

        var x = 0;

        let keys = def.getIds();

        var out = def.each(function (model: any, id: string, obj: any[]) {

          expect(model).to.be.equal(def.getByKey(x));
          expect(id).to.be.equal(keys[x]);
          expect(obj).to.be.eql(def.getAll());

          x++;

        });

        expect(x).to.be.equal(3);

        expect(out).to.be.equal(def);

      });

      it("should set the scope to global if thisArg not set", function () {

        var self = this;
        var out = def.each(function () {
          expect(this).to.not.be.equal(self);
        });

        expect(out).to.be.equal(def);

      });

      it("should receive a function and set the scope with the second parameter to this", function () {

        var self = this;

        var out = def.each(function () {
          expect(this).to.be.equal(self);
        }, this);

        expect(out).to.be.equal(def);

      });

      it("should set the scope to a different object", function () {

        var out = def.each(function () {
          expect(this.fn).to.be.a("function");
          expect(this.id).to.be.equal(12345);
        }, {
          fn: function () {
          },
          id: 12345
        });

        expect(out).to.be.equal(def);

      });

      it("should throw an error when a non-function received", function () {

        var fail = false;

        try {
          def.each("string");
        } catch (err) {
          fail = true;

          expect(err).to.be.instanceof(TypeError);
          expect(err.message).to.be.equal("iterator must be a function");
        }

        expect(fail).to.be.true;

      });

    });

    describe("#eachRight", function () {

      it("should run the eachRight method", function () {

        var x = 3;

        let keys = def.getIds();

        var out = def.eachRight(function (model: any, id: string, obj: any[]) {

          x--;

          expect(model).to.be.equal(def.getByKey(x));
          expect(id).to.be.equal(keys[x]);
          expect(obj).to.be.eql(def.getAll());

        });

        expect(x).to.be.equal(0);

        expect(out).to.be.equal(def);

      });

      it("should set the scope to global if thisArg not set", function () {

        var self = this;
        var out = def.eachRight(function () {
          expect(this).to.not.be.equal(self);
        });

        expect(out).to.be.equal(def);

      });

      it("should receive a function and set the scope with the second parameter to this", function () {

        var self = this;

        var out = def.eachRight(function () {
          expect(this).to.be.equal(self);
        }, this);

        expect(out).to.be.equal(def);

      });

      it("should set the scope to a different object", function () {

        var out = def.eachRight(function () {
          expect(this.fn).to.be.a("function");
          expect(this.id).to.be.equal(12345);
        }, {
          fn: function () {
          },
          id: 12345
        });

        expect(out).to.be.equal(def);

      });

      it("should throw an error when a non-function received", function () {

        var fail = false;

        try {
          def.eachRight("string");
        } catch (err) {
          fail = true;

          expect(err).to.be.instanceof(TypeError);
          expect(err.message).to.be.equal("iterator must be a function");
        }

        expect(fail).to.be.true;

      });

    });

    describe("#filter", function () {

      describe("single property", function () {

        it("should filter a single result", function () {

          var orig = def.clone();

          var out = def.filter({
            float: 2.2
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(2);
          expect(orig.getByKey(1)).to.be.equal(out.getByKey(0));
          expect(orig.getByKey(2)).to.be.equal(out.getByKey(1));

        });

        it("should filter multiple results", function () {

          var orig = def.clone();

          var out = def.filter({
            float: 2.3
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(1);
          expect(orig.getByKey(0)).to.be.equal(out.getByKey(0));

        });

        it("should filter no results", function () {

          var orig = def.clone();

          var out = def.filter({
            float: "nothing"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(3);
          expect(orig.getByKey(0)).to.be.equal(out.getByKey(0));
          expect(orig.getByKey(1)).to.be.equal(out.getByKey(1));
          expect(orig.getByKey(2)).to.be.equal(out.getByKey(2));

        });

        it("should search an instance of an object and filter one result", function () {

          var out = def.filter({
            datetime: new Date(2010, 1, 7)
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(2);

        });

        it("should search an instance of an object and filter multiple results", function () {

          /* Change the third collection object */
          def.getByKey(2)
            .set("datetime", "2010-02-08");

          var out = def.filter({
            datetime: new Date(2010, 1, 8)
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(1);

        });

        it("should search an instance of an object and filter nothing", function () {

          var out = def.filter({
            datetime: new Date("2010-02-01")
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(3);

        });

        it("should cast to the datatype and filter one result", function () {

          var out = def.filter({
            float: "2.2"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(2);

        });

        it("should cast to the datatype and filter multiple results", function () {

          var out = def.filter({
            float: "2.3"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(1);

        });

        it("should cast to the datatype and filter no results", function () {

          var out = def.filter({
            float: "2"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(3);

        });

      });

      describe("multiple properties", function () {

        it("should filter a single result", function () {

          var orig = def.clone();

          var out = def.filter({
            float: 2.2,
            string: "string"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(2);
          expect(orig.getByKey(1)).to.be.equal(out.getByKey(0));
          expect(orig.getByKey(2)).to.be.equal(out.getByKey(1));

        });

      });

      it("should filter multiple results", function () {

        var orig = def.clone();

        var out = def.filter({
          float: 2.3,
          string: "string"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(1);
        expect(orig.getByKey(0)).to.be.equal(out.getByKey(0));

      });

      it("should filter no results", function () {

        var out = def.filter({
          float: 2.3,
          string: "nothing"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(3);

      });

      it("should search an instance of an object and filter one result", function () {

        var out = def.filter({
          float: 2.2,
          integer: 2
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(2);

      });

      it("should search an instance of an object and filter multiple results", function () {

        var out = def.filter({
          float: 2.3,
          integer: 2
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(1);

      });

      it("should search an instance of an object and filter nothing", function () {

        var out = def.filter({
          float: 2.1,
          integer: 2
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(3);

      });

      it("should cast to the datatype and filter one result", function () {

        var out = def.filter({
          integer: "2",
          datetime: "2010-02-07"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(2);

      });

      it("should cast to the datatype and filter multiple results", function () {

        /* Change the third collection object */
        def.getByKey(2)
          .set("datetime", "2010-02-08");

        var out = def.filter({
          integer: "2",
          datetime: "2010-02-08"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(1);

      });

      it("should cast to the datatype and filter no results", function () {

        var out = def.filter({
          integer: "2",
          datetime: "2010-02-10"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(3);

      });

      it("should throw an error if non-object passed in", function () {

        var fail = false;

        try {
          def.filter();
        } catch (err) {

          fail = true;
          expect(err).to.be.instanceof(TypeError);
          expect(err.message).to.be.equal("Model.where properties must be an object");

        } finally {

          expect(fail).to.be.true;

        }
      });

    });

    describe("#find", function () {

      it("should return a unique object", function () {

        expect(def.find({
          float: 2.2
        })).to.be.equal(def.getByKey(0));

      });

      it("should return the first of a non-unique object", function () {

        expect(def.find({
          float: 2.3
        })).to.be.equal(def.getByKey(1));

      });

      it("should return null if nothing matches", function () {

        expect(def.find({
          float: 2.4
        })).to.be.null;

      });

    });

    describe("#findLast", function () {

      it("should return a unique object", function () {

        expect(def.findLast({
          float: 2.2
        })).to.be.equal(def.getByKey(0));

      });

      it("should return the last of a non-unique object", function () {

        expect(def.findLast({
          float: 2.3
        })).to.be.equal(def.getByKey(2));

      });

      it("should return null if nothing matches", function () {

        expect(def.findLast({
          float: 2.4
        })).to.be.null;

      });

    });

    describe("#getAll", function () {

      it("should return all the models", function () {

        let obj = new this.Children();

        expect(obj.getAll()).to.be.eql([]);

        obj.addOne({
          boolean: true
        });
        expect(obj.getAll()).to.be.an("array")
          .to.have.length(1);
        expect(obj.getAll()[0]).to.have.all.keys([
          "id",
          "model"
        ]);
        expect(obj.getAll()[0].id).to.be.a("string")
          .match(UUID_V4);
        expect(obj.getAll()[0].model).to.be.eql(new this.Child({
          boolean: true
        }));

      });

    });

    describe("#getData", function () {

      it("should allow retrieval of the parsed getter data", function () {

        class Mod extends Model {
          protected _schema () {
            return {
              string: {
                type: "string"
              }
            };
          }
          protected _getString (value: string) : string {
            return `hello ${value}`;
          }
        }

        class Col extends Collection {
          _model () {
            return Mod;
          }
        }

        const obj = new Col([{
          string: "world"
        }, {
          string: "Dave"
        }]);

        expect(obj.getData()).to.be.eql([{
          string: "hello world"
        }, {
          string: "hello Dave"
        }]);

        expect(obj.getData(true)).to.be.eql([{
          string: "hello world"
        }, {
          string: "hello Dave"
        }]);

        expect(obj.getData(false)).to.be.eql([{
          string: "world"
        }, {
          string: "Dave"
        }]);

      });

    });

    describe("getters", function () {

      let obj: any,
        model1: any,
        model2: any,
        id1: string,
        id2: string;
      beforeEach(function () {

        model1 = new this.Child({
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        });

        model2 = new this.Child({
          boolean: "false",
          datetime: "2011-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        });

        obj = new this.Children([
          model1,
          model2
        ]);

        expect(obj.getCount()).to.be.equal(2);

        let data = obj.getAll();
        id1 = data[0].id;
        id2 = data[1].id;

      });

      describe("#getAllById", function () {

        it("should get in the model order", function () {

          expect(obj.getAllById([id2, id1])).to.be.eql([
            model1,
            model2
          ]);

        });

        it("should ignore non-existent IDs", function () {

          expect(obj.getAllById([id2, uuid.v4(), "ddd", "eee"])).to.be.eql([
            model2
          ]);

        });

        it("should return an empty array if no valid IDs", function () {

          expect(obj.getAllById([uuid.v4(), "eee", "fff"])).to.be.eql([]);

        });

      });

      describe("#getAllByKey", function () {

        it("should get in the model order", function () {

          expect(obj.getAllByKey([1, 0])).to.be.eql([
            model1,
            model2
          ]);

        });

        it("should ignore non-existent IDs", function () {

          expect(obj.getAllByKey([0, 3, 5, 3])).to.be.eql([
            model1
          ]);

        });

        it("should return an empty array if no valid IDs", function () {

          expect(obj.getAllByKey([3, 5, 3])).to.be.eql([]);

        });

      });

      describe("#getAllByModel", function () {

        it("should get in the model order", function () {

          expect(obj.getAllByModel([model2, model1])).to.be.eql([
            model1,
            model2
          ]);

        });

        it("should ignore non-existent IDs", function () {

          let model3 = new this.Child();
          let model4 = new this.Child();
          let model5 = new this.Child();

          expect(obj.getAllByModel([model1, model3, model4, model5])).to.be.eql([
            model1
          ]);

        });

        it("should return an empty array if no valid IDs", function () {

          let model3 = new this.Child();
          let model4 = new this.Child();
          let model5 = new this.Child();

          expect(obj.getAllByModel([model5, model3, model4])).to.be.eql([]);

        });

      });

      describe("#getById", function () {

        it("should return the desired model", function () {

          expect(obj.getById(id1)).to.be.equal(model1);
          expect(obj.getById(id2)).to.be.equal(model2);

        });

        it("should return null if none valid", function () {

          expect(obj.getById(uuid.v4())).to.be.null;

        });

      });

      describe("#getByKey", function () {

        it("should return the desired model", function () {

          expect(obj.getByKey(0)).to.be.equal(model1);
          expect(obj.getByKey(1)).to.be.equal(model2);

        });

        it("should return null if none valid", function () {

          expect(obj.getByKey(3)).to.be.null;

        });

      });

      describe("#getByModel", function () {

        it("should return the desired model", function () {

          expect(obj.getByModel(model1)).to.be.equal(model1);
          expect(obj.getByModel(model2)).to.be.equal(model2);

        });

        it("should return null if none valid", function () {

          let model3 = new this.Child;

          expect(obj.getByModel(model3)).to.be.null;

        });

      });

    });

    describe("#limit", function () {

      var obj: any,
        raw: any;
      beforeEach(function () {

        raw = [{
          boolean: true,
          datetime: new Date("2010-02-07"),
          float: 2.3,
          integer: 2,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date("2010-02-08"),
          float: 2.3,
          integer: 2,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date("2010-02-09"),
          float: 2.3,
          integer: 2,
          string: "string"
        }];

        obj = new this.Children(raw);
      });

      it("should throw an error when no limit is provided", function () {

        var fail = false;

        try {
          obj.limit();
        } catch (err) {

          fail = true;

          expect(err).to.be.instanceof(TypeError);
          expect(err.message).to.be.equal("Collection.limit must be a positive integer");

        } finally {

          expect(fail).to.be.true;

        }

      });

      it("should throw an error when no limit is below 0", function () {

        var fail = false;

        try {
          obj.limit(-1);
        } catch (err) {

          fail = true;

          expect(err).to.be.instanceof(TypeError);
          expect(err.message).to.be.equal("Collection.limit must be a positive integer");

        } finally {

          expect(fail).to.be.true;

        }

      });

      it("should return no items when limit is 0", function () {

        expect(obj.limit(0)).to.be.equal(obj);

        expect(obj.getData()).to.be.eql([]);

      });

      it("should return the correct number of items specified", function () {

        for (var i = 1; i < 3; i++) {

          var newObj = obj.clone();

          expect(newObj.limit(i)).to.be.equal(newObj);

          expect(newObj.getData()).to.be.eql(raw.slice(0, i));

        }

      });

      it("should return all items when the limit is greater than the count", function () {

        expect(obj.limit(3)).to.be.equal(obj);

        expect(obj.getData()).to.be.eql(raw);

      });

      it("should ignore offset if below 0", function () {

        expect(obj.limit(3, -1)).to.be.equal(obj);

        expect(obj.getData()).to.be.eql(raw);

      });

      it("should offset the number of items", function () {

        for (var i = 0; i < 3; i++) {

          var newObj = obj.clone();

          expect(newObj.limit(1, i)).to.be.equal(newObj);

          expect(newObj.getData()).to.be.eql([
            raw[i]
          ]);

        }

      });

      it("should do another offset test", function () {

        expect(obj.limit(2, 1)).to.be.equal(obj);

        expect(obj.getData()).to.be.eql([
          raw[1],
          raw[2]
        ]);

      });

    });

    describe("#removeById", function () {

      var obj: any,
        raw: any;
      beforeEach(function () {

        raw = [{
          boolean: true,
          datetime: new Date("2010-02-07"),
          float: 2.3,
          integer: 2,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date("2010-02-08"),
          float: 2.3,
          integer: 2,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date("2010-02-09"),
          float: 2.3,
          integer: 2,
          string: "string"
        }];

        obj = new this.Children(raw);

        this.emitSpy = sinon.spy(obj, "emit");

        expect(obj.getCount()).to.be.equal(3);
      });

      it("should return false if nothing removed", function () {

        expect(obj.removeById(uuid.v4())).to.be.false;
        expect(obj.removeById("string")).to.be.false;

        expect(obj.getCount()).to.be.equal(3);

        expect(this.emitSpy).to.not.be.called;

      });

      it("should return true if removed", function () {

        let models = obj.getAll();

        let ids = obj.getIds();

        expect(obj.removeById(ids[0])).to.be.true;

        expect(this.emitSpy).to.be.calledOnce
          .calledWithExactly("model_removed", models[0].model, 0, ids[0]);

        expect(obj.getCount()).to.be.equal(2);

        expect(obj.removeById(ids[2])).to.be.true;

        expect(this.emitSpy).to.be.calledTwice
          .calledWithExactly("model_removed", models[0].model, 0, ids[0])
          .calledWithExactly("model_removed", models[2].model, 1, ids[2]);

        expect(obj.getCount()).to.be.equal(1);

        expect(obj.removeById(ids[1])).to.be.true;

        expect(this.emitSpy).to.be.calledThrice
          .calledWithExactly("model_removed", models[0].model, 0, ids[0])
          .calledWithExactly("model_removed", models[2].model, 1, ids[2])
          .calledWithExactly("model_removed", models[1].model, 0, ids[1]);

        expect(obj.getCount()).to.be.equal(0);

      });

    });

    describe("#removeByModel", function () {

      var obj: any,
        raw: any;
      beforeEach(function () {

        raw = [{
          boolean: true,
          datetime: new Date("2010-02-07"),
          float: 2.3,
          integer: 2,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date("2010-02-08"),
          float: 2.3,
          integer: 2,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date("2010-02-09"),
          float: 2.3,
          integer: 2,
          string: "string"
        }];

        obj = new this.Children(raw);

        this.emitSpy = sinon.spy(obj, "emit");

        expect(obj.getCount()).to.be.equal(3);
      });

      it("should return false if nothing removed", function () {

        expect(obj.removeByModel(new this.Child)).to.be.false;

        expect(obj.getCount()).to.be.equal(3);

        expect(this.emitSpy).to.not.be.called;

      });

      it("should return true if removed", function () {

        let models = obj.getAll();

        expect(obj.removeByModel(models[0].model)).to.be.true;

        expect(obj.getCount()).to.be.equal(2);

        expect(this.emitSpy).to.be.calledOnce
          .calledWithExactly("model_removed", models[0].model, 0, models[0].id);

        expect(obj.removeByModel(models[2].model)).to.be.true;

        expect(this.emitSpy).to.be.calledTwice
          .calledWithExactly("model_removed", models[0].model, 0, models[0].id)
          .calledWithExactly("model_removed", models[2].model, 1, models[2].id);

        expect(obj.getCount()).to.be.equal(1);

        expect(obj.removeByModel(models[1].model)).to.be.true;

        expect(obj.getCount()).to.be.equal(0);

        expect(this.emitSpy).to.be.calledThrice
          .calledWithExactly("model_removed", models[0].model, 0, models[0].id)
          .calledWithExactly("model_removed", models[2].model, 1, models[2].id)
          .calledWithExactly("model_removed", models[1].model, 0, models[1].id);

      });

    });

    describe("#reset", function () {

      it("should return false when data is empty", function () {

        var obj = new this.Children();

        expect(obj.reset()).to.be.false;

      });

      it("should return true when data not empty", function () {

        var obj = new this.Children([
          {
            boolean: "true",
            date: "2010-02-07",
            float: "2.3",
            integer: "2",
            string: "string"
          },
          {
            boolean: "true",
            date: "2010-02-08",
            float: "2.3",
            integer: "2",
            string: "string"
          },
          {
            boolean: "true",
            date: "2010-02-09",
            float: "2.3",
            integer: "2",
            string: "string"
          }
        ]);

        expect(obj.reset()).to.be.true;

        expect(obj.getCount()).to.be.equal(0);

        expect(obj.reset()).to.be.false;

      });

    });

    describe("sorting", function () {

      var champs: any;
      beforeEach(function () {

        /* Define a driver model */
        class Driver extends Model {
          protected _schema () {
            let obj: any;
            obj = {
              id: {
                type: "integer",
                value: null
              },
              firstName: {
                type: "string",
                value: null
              },
              lastName: {
                type: "string",
                value: null
              },
              team: {
                type: "string",
                value: null
              },
              dateOfBirth: {
                type: "date",
                value: null
              },
              championYears: {
                type: "array",
                value: null
              }
            };
            return obj;
          }

          public setChampionYears (value: any, def: any) {
            if (value instanceof Array) {
              value.forEach((val: any) => {
                this.setChampionYears(val, def);
              });
            } else {
              value = Base.datatypes.setInt(value, null);

              if (value !== null && _.indexOf(this.get("championYears"), value) === -1) {

                if (this.get("championYears") === null) {
                  this.Data.championYears = [];
                }

                this.Data.championYears.push(value);
              }
            }
          }
        }

        class Champions extends Collection {
          protected _model () {
            return Driver;
          }
        }

        champs = new Champions([
          {
            id: 1,
            firstName: "Sebastian",
            lastName: "Vettel",
            dateOfBirth: "1987-07-03",
            team: "Red Bull",
            championYears: [
              2010,
              2011,
              2012,
              2013
            ]
          },
          {
            id: 2,
            firstName: "Jenson",
            lastName: "Button",
            dateOfBirth: "1980-01-19",
            team: "McLaren",
            championYears: [
              2009
            ]
          },
          {
            id: 0,
            firstName: "Lewis",
            lastName: "Hamilton",
            dateOfBirth: "1985-01-07",
            team: "Mercedes",
            championYears: [
              2008
            ]
          },
          {
            id: 4,
            firstName: "james",
            lastName: "hunt",
            dateOfBirth: "1947-08-29",
            team: "mclaren",
            championYears: [
              1976
            ]
          },
          {
            id: 3,
            firstName: "Nico",
            lastName: "Rosberg",
            dateOfBirth: "1985-06-27",
            team: "Mercedes",
            championYears: null
          }
        ]);

        expect(champs).to.be.an.instanceof(Champions);

        expect(champs.getByKey(0).get("firstName")).to.be.equal("Sebastian");
        expect(champs.getByKey(1).get("firstName")).to.be.equal("Jenson");
        expect(champs.getByKey(2).get("firstName")).to.be.equal("Lewis");
        expect(champs.getByKey(3).get("firstName")).to.be.equal("james");
        expect(champs.getByKey(4).get("firstName")).to.be.equal("Nico");

        this.Driver = Driver;
        this.Champions = Champions;
      });

      describe("#sort", function () {

        it("should allow me to write a sort function", function () {

          var arr = _.reduce(champs.getAll(), (result: any[], data: ICollectionData) => {
            result.push(data.model);
            return result;
          }, []);

          var result = champs.sort((a: any, b: any) => {

            expect(a).to.be.an("object")
              .to.have.keys([
              "id", "model"
            ]);
            expect(a.id).to.be.a("string");
            expect(champs.getById(a.id)).to.be.an("object");

            expect(b).to.be.an("object")
              .to.have.keys([
              "id", "model"
            ]);
            expect(b.id).to.be.a("string");
            expect(champs.getById(b.id)).to.be.an("object");

            /* Confirm that a contains a model */
            var includedA = _.some(arr, function (model) {
              return model === a.model;

            });
            expect(includedA).to.be.true;
            expect(a.model).to.be.instanceof(this.Driver);

            /* Confirm that b contains a model */
            var includedB = _.some(arr, function (model) {
              return model === b.model;

            });
            expect(includedB).to.be.true;
            expect(b.model).to.be.instanceof(this.Driver);

            /* Sort by last name */
            if (a.model.get("lastName") < b.model.get("lastName")) {
              return -1;
            } else if (a.model.get("lastName") > b.model.get("lastName")) {
              return 1;
            } else {
              return 0;
            }

          });

          /* Hunt comes after Jenson now as he's in lower case */
          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            },
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            }
          ]);

        });

        it("should throw an error when a function not received", function () {

          [
            null,
            undefined,
            new Date(),
            {},
            [],
            "string",
            2.3,
            4
          ].forEach(function (input) {

            var fail = false;

            try {
              champs.sort(input);
            } catch (err) {
              fail = true;

              expect(err).to.be.instanceof(TypeError);
              expect(err.message).to.be.equal("Collection.sort must receive a function");
            } finally {
              expect(fail).to.be.true;
            }

          });

        });

      });

      describe("#sortBy", function () {

        it("should sort by key in ascending order", function () {

          var result = champs.sortBy({
            firstName: "AsC"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            },
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            }
          ]);

        });

        it("should sort by key in ascending order by specifying invalid order", function () {

          var result = champs.sortBy({
            firstName: "bumtitty"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            },
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            }
          ]);

        });

        it("should sort by descending order", function () {

          var result = champs.sortBy({
            firstName: "DeSc"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            }
          ]);

        });

        it("should sort by one key with duplicate data with nothing else - ascending", function () {

          var result = champs.sortBy({
            team: "ASC"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            }
          ]);

        });

        it("should sort by one key with duplicate data with nothing else - descending", function () {

          var result = champs.sortBy({
            team: "DESC"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            }
          ]);

        });

        it("should sort by two keys", function () {

          var result = champs.sortBy({
            team: "ASC",
            lastName: "ASC"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            }
          ]);

        });

        it("should sort by an integer", function () {

          var result = champs.sortBy({
            id: "asc"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            },
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            },
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            }
          ]);

        });

        it("should sort by an integer descending", function () {

          var result = champs.sortBy({
            id: "desc"
          });

          expect(result).to.be.equal(champs);
          expect(champs.getData()).to.be.eql([
            {
              id: 4,
              firstName: "james",
              lastName: "hunt",
              team: "mclaren",
              dateOfBirth: new Date(1947, 7, 29),
              championYears: [
                1976
              ]
            },
            {
              id: 3,
              firstName: "Nico",
              lastName: "Rosberg",
              dateOfBirth: new Date(1985, 5, 27),
              team: "Mercedes",
              championYears: null
            },
            {
              id: 2,
              firstName: "Jenson",
              lastName: "Button",
              team: "McLaren",
              dateOfBirth: new Date(1980, 0, 19),
              championYears: [
                2009
              ]
            },
            {
              id: 1,
              firstName: "Sebastian",
              lastName: "Vettel",
              team: "Red Bull",
              dateOfBirth: new Date(1987, 6, 3),
              championYears: [
                2010,
                2011,
                2012,
                2013
              ]
            },
            {
              id: 0,
              firstName: "Lewis",
              lastName: "Hamilton",
              team: "Mercedes",
              dateOfBirth: new Date(1985, 0, 7),
              championYears: [
                2008
              ]
            }
          ]);

        });

        it("should throw an error with non-string, array or object", function () {

          [
            void 0,
            function () {
            },
            [],
            "string",
            2.3,
            4,
            true,
            false,
            null
          ].forEach(function (input) {

            var fail = false;

            try {
              champs.sortBy(input);
            } catch (err) {
              fail = true;

              expect(err).to.be.instanceof(TypeError);
              expect(err.message).to.be
                .equal("Collection.sortBy must receive an object of keys and directions");
            } finally {
              expect(fail).to.be.true;
            }

          });

        });

      });

    });

    describe("#toDb", function () {

      it("should return the db version", function () {

        var obj = new this.Children([{
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        }, {
          boolean: "true",
          datetime: "2010-02-07",
          float: "2.3",
          integer: "2",
          string: "string"
        }]);

        expect(obj.toDb()).to.be.eql([{
          boolean: true,
          datetime: new Date(2010, 1, 7),
          float: 2.3,
          int: 2,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date(2010, 1, 7),
          float: 2.3,
          int: 2,
          string: "string"
        }]);

      });

      it("should return an empty array if nothing set", function () {

        var obj = new this.Children();

        expect(obj.toDb()).to.be.eql([]);

      });

    });

    describe("#validate", function () {

      let obj: any;
      beforeEach(function () {

        class User extends Model {
          protected _schema () {
            return {
              id: {
                type: "string",
                validation: [{
                  rule: "required"
                }]
              },
              emailAddress: {
                type: "string",
                validation: [{
                  rule: "required"
                }, {
                  rule: "email"
                }, {
                  rule: "minLength",
                  param: [
                    3
                  ]
                }]
              }
            };
          }
        }

        class Users extends Collection {
          protected _model () {
            return User;
          }
        }

        obj = new Users;

        this.User = User;
        this.Users = Users;

      });

      it("should validate all models", function () {

        obj.add([{
          id: "12345",
          emailAddress: "test@testington.com"
        }]);

        expect(obj.validate()).to.be.true;

      });

      it("should fail validation for a single reason", function () {

        let fail = false;

        obj.add([{}]);

        try {
          obj.validate();
        } catch (err) {

          fail = true;

          expect(err).to.be.instanceof(ValidationException);
          expect(err.message).to.be.equal("Collection validation error");

          expect(err.getErrors()).to.be.eql({
            "0_id": [{
              message: "VALUE_REQUIRED",
              value: null
            }],
            "0_emailAddress": [{
              message: "VALUE_REQUIRED",
              value: null
            }]
          });

        } finally {
          expect(fail).to.be.true;
        }

      });

      it("should fail validation for a multiple reasons", function () {

        let fail = false;

        obj.add([{
          emailAddress: "u"
        }, {

        }]);

        try {
          obj.validate();
        } catch (err) {

          fail = true;

          expect(err).to.be.instanceof(ValidationException);
          expect(err.message).to.be.equal("Collection validation error");

          expect(err.getErrors()).to.be.eql({
            "0_id": [{
              message: "VALUE_REQUIRED",
              value: null
            }],
            "0_emailAddress": [{
              message: "VALUE_NOT_EMAIL",
              value: "u"
            }, {
              message: "VALUE_LESS_THAN_MIN_LENGTH",
              value: "u",
              additional: [
                3
              ]
            }],
            "1_id": [{
              message: "VALUE_REQUIRED",
              value: null
            }],
            "1_emailAddress": [{
              message: "VALUE_REQUIRED",
              value: null
            }]
          });

        } finally {
          expect(fail).to.be.true;
        }

      });

    });

    describe("#where", function () {

      describe("single property", function () {

        it("should return a single result", function () {

          var orig = def.clone();

          var out = def.where({
            float: 2.2
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(1);
          expect(orig.getByKey(0)).to.be.equal(out.getByKey(0));

        });

        it("should return multiple results", function () {

          var orig = def.clone();

          var out = def.where({
            float: 2.3
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(2);
          expect(orig.getByKey(1)).to.be.equal(out.getByKey(0));
          expect(orig.getByKey(2)).to.be.equal(out.getByKey(1));

        });

        it("should return no results", function () {

          var out = def.where({
            float: "nothing"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(0);

        });

        it("should search an instance of an object and return one result", function () {

          var out = def.where({
            datetime: new Date(2010, 1, 7)
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(1);

        });

        it("should search an instance of an object and return multiple results", function () {

          /* Change the third collection object */
          def.getByKey(2).set("datetime", "2010-02-08");

          var out = def.where({
            datetime: new Date(2010, 1, 8)
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(2);

        });

        it("should search an instance of an object and return nothing", function () {

          var out = def.where({
            datetime: new Date("2010-02-01")
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(0);

        });

        it("should cast to the datatype and return one result", function () {

          var out = def.where({
            float: "2.2"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(1);

        });

        it("should cast to the datatype and return multiple results", function () {

          var out = def.where({
            float: "2.3"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(2);

        });

        it("should cast to the datatype and return no results", function () {

          var out = def.where({
            float: "2"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(0);

        });

      });

      describe("multiple properties", function () {

        it("should return a single result", function () {

          var orig = def.clone();

          var out = def.where({
            float: 2.2,
            string: "string"
          });

          expect(out).to.be.instanceof(Collection)
            .to.be.equal(def);
          expect(out.getCount()).to.be.equal(1);
          expect(orig.getByKey(0)).to.be.equal(out.getByKey(0));

        });

      });

      it("should return multiple results", function () {

        var orig = def.clone();

        var out = def.where({
          float: 2.3,
          string: "string"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(2);
        expect(orig.getByKey(1)).to.be.equal(out.getByKey(0));
        expect(orig.getByKey(2)).to.be.equal(out.getByKey(1));

      });

      it("should return no results", function () {

        var out = def.where({
          float: 2.3,
          string: "nothing"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(0);

      });

      it("should search an instance of an object and return one result", function () {

        var out = def.where({
          float: 2.2,
          integer: 2
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(1);

      });

      it("should search an instance of an object and return multiple results", function () {

        var out = def.where({
          float: 2.3,
          integer: 2
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(2);

      });

      it("should search an instance of an object and return nothing", function () {

        var out = def.where({
          float: 2.1,
          integer: 2
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(0);

      });

      it("should cast to the datatype and return one result", function () {

        var out = def.where({
          integer: "2",
          datetime: "2010-02-07"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(1);

      });

      it("should cast to the datatype and return multiple results", function () {

        /* Change the third collection object */
        def.getByKey(2).set("datetime", "2010-02-08");

        var out = def.where({
          integer: "2",
          datetime: "2010-02-08"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(2);

      });

      it("should cast to the datatype and return no results", function () {

        var out = def.where({
          integer: "2",
          datetime: "2010-02-10"
        });

        expect(out).to.be.instanceof(Collection)
          .to.be.equal(def);
        expect(out.getCount()).to.be.equal(0);

      });

      it("should throw an error if non-object passed in", function () {

        var fail = false;

        try {
          def.where();
        } catch (err) {

          fail = true;
          expect(err).to.be.instanceof(TypeError);
          expect(err.message).to.be.equal("Model.where properties must be an object");

        } finally {

          expect(fail).to.be.true;

        }
      });

    });

  });

  describe("Static methods", function () {

    describe("#toModels", function () {

      it("should convert an array of database objects into a collection model", function () {

        var obj = this.Children.toModels([{
          boolean: true,
          datetime: new Date(2010, 1, 7),
          float: 2.3,
          int: 3,
          string: "string"
        }, {
          boolean: true,
          datetime: new Date(2010, 1, 8),
          float: 2.3,
          int: 2,
          string: "string"
        }]);

        expect(obj).to.be.instanceof(Collection)
          .instanceof(this.Children);

        expect(obj.getCount()).to.be.equal(2);
        expect(obj.getByKey(0)).to.be.instanceof(Model);
        expect(obj.getByKey(1)).to.be.instanceof(Model);

        expect(obj.getData()).to.be.eql([
          {
            boolean: true,
            datetime: new Date(2010, 1, 7),
            float: 2.3,
            integer: 3,
            string: "string"
          },
          {
            boolean: true,
            datetime: new Date(2010, 1, 8),
            float: 2.3,
            integer: 2,
            string: "string"
          }
        ]);

      });

      it("should not push some rubbish object to a model", function () {

        var obj = this.Children.toModels([{}]);

        expect(obj).to.be.instanceof(Collection)
          .instanceof(this.Children);

        expect(obj.getCount()).to.be.equal(0);

      });

      it("should not push some rubbish array to a model", function () {

        var obj = this.Children.toModels([
          {},
          null,
          Date,
          function () {
          },
          "string",
          2.3,
          4,
          true,
          false,
          undefined,
          Infinity,
          NaN,
          []
        ]);

        expect(obj).to.be.instanceof(Collection)
          .instanceof(this.Children);

        expect(obj.getCount()).to.be.equal(0);

      });

      it("should not push a non-array or non-object to a model", function () {

        [
          null,
          Date,
          function () {
          },
          "string",
          2.3,
          4,
          true,
          false,
          undefined,
          Infinity,
          NaN
        ].forEach((input) => {

          var obj = this.Children.toModels(input);

          expect(obj).to.be.instanceof(Collection)
            .instanceof(this.Children);

          expect(obj.getCount()).to.be.equal(0);

        });

      });

    });

  });

});
