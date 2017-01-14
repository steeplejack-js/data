/**
 * index
 */

/* Node modules */

/* Third-party modules */

/* Files */
import {expect} from '../helpers/configure';
import data from '../../src/index';
import Collection from '../../src/lib/collection';
import Model from '../../src/lib/model';

describe('Index tests', function () {

  it('should expose the collection and model', function () {

    expect(data).to.be.an('object');
    expect(data).to.have.keys([
      'Collection',
      'Model'
    ]);
    expect(data.Collection).to.be.equal(Collection);
    expect(data.Model).to.be.equal(Model);

  });

});
