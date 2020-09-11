/* global describe, it */

'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const Enumeration = require('@northscaler/enum-support')

const extractDtoFromEntity = require('../../../main/service/extractDtoFromEntity')

describe('unit tests of extractDtoFromEntity', () => {
  it('should work', async function () {
    const Boolean = Enumeration.new({ name: 'Boolean', values: ['TRUE', 'FALSE'] })
    const date = '2020/1/1'
    const entity = {
      _zero: false,
      _one: 1,
      _two: {
        _three: 3,
        _four: null,
        _five: undefined,
        _six: [6, -6, {
          _nine: 9
        }],
        _seven: new Date(date)
      },
      _eight: it => it,
      _ten: Boolean.TRUE
    }
    Object.defineProperty(entity, 'one', {
      get: function () { return this._one },
      set: function (v) { this._one = v }
    })

    expect(extractDtoFromEntity(entity)).to.deep.equal({
      zero: false,
      one: 1,
      two: {
        three: 3,
        four: null,
        five: undefined,
        six: [6, -6, { nine: 9 }],
        seven: new Date(date).toISOString()
      },
      ten: Boolean.TRUE.name
    })

    expect(extractDtoFromEntity(entity, {
      keyReplacementRegEx: null,
      dateFormatter: it => `date:${it.toISOString()}`,
      enumerationFormatter: it => it.ordinal
    })).to.deep.equal({
      _zero: false,
      _one: 1,
      _two: {
        _three: 3,
        _four: null,
        _five: undefined,
        _six: [6, -6, { _nine: 9 }],
        _seven: 'date:' + new Date(date).toISOString()
      },
      _ten: 0
    })
  })
})
