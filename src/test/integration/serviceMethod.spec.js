/* global describe, it */

'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const { serviceMethod } = require('../../main').decorators
const { DateFormat, ResponseStatus } = require('../../main').enums
const { CodedError } = require('@northscaler/error-support')

const OopsyError = CodedError({ name: 'Oopsy' })

class AdditionService {
  @serviceMethod()
  async add ({ a, b, at }) {
    return this._add({ a, b, at })
  }

  @serviceMethod({ includeErrorStacks: false })
  async addNoStacktrace ({ a, b, at }) {
    return this._add({ a, b, at })
  }

  @serviceMethod({ dateFormat: DateFormat.UNIX_MILLISECONDS })
  async addWithUnixMillisecondsFormat ({ a, b, at }) {
    return this._add({ a, b, at })
  }

  async _add ({ a, b, at }) {
    if (typeof a !== 'number' || typeof b !== 'number') throw new OopsyError({ msg: 'arguments not both numbers' })

    return { sum: a + b, at }
  }
}

const adder = new AdditionService()

describe('integration tests of @serviceMethod', () => {
  it('should return successful response', async function () {
    const dto = { a: 1, b: 2, at: new Date() }

    const expected = {
      data: { sum: dto.a + dto.b, at: dto.at.toISOString() },
      meta: {
        status: ResponseStatus.SUCCESS.name
      }
    }

    let actual = await adder.add(dto)
    console.log(JSON.stringify(actual, null, 2))

    expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
    delete actual.meta.elapsedMillis

    expect(actual).to.deep.equal(expected)

    expected.data.at = dto.at.getTime()

    actual = await adder.addWithUnixMillisecondsFormat(dto)
    console.log(JSON.stringify(actual, null, 2))

    expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
    delete actual.meta.elapsedMillis

    expect(actual).to.deep.equal(expected)
  })

  it('should return error response', async function () {
    const dto = { a: 1, b: 'foo' }

    const expected = {
      error: {
        name: 'Oopsy',
        message: 'E_OOPSY: arguments not both numbers',
        code: 'E_OOPSY'
      },
      meta: {
        status: ResponseStatus.FAILURE.name
      }
    }

    let actual = await adder.add(dto)

    expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
    delete actual.meta.elapsedMillis

    expect(typeof actual?.error?.stack).to.equal('string')
    delete actual.error.stack

    expect(actual).to.deep.equal(expected)

    actual = await adder.addNoStacktrace(dto)
    console.log(JSON.stringify(actual, null, 2))

    expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
    delete actual.meta.elapsedMillis

    expect(actual?.error?.stack).not.to.be.ok()

    expect(actual).to.deep.equal(expected)
  })
})
