/**
 * config
 */

/* Node modules */

/* Third-party modules */
import chai from "chai";
import bluebird from "bluebird";
import chaiAsPromised from "chai-as-promised";
import proxyquire from "proxyquire";
import sinon from "sinon";
import sinonAsPromised from "sinon-as-promised";
import sinonChai from "sinon-chai";

/* Files */

chai.use(sinonChai);
chai.use(chaiAsPromised);

sinonAsPromised(bluebird);

const expect = chai.expect;

proxyquire.noCallThru();

export {
  expect,
  proxyquire,
  sinon
};
