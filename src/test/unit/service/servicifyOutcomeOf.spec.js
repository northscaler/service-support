/* global describe, it */

'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const { CodedError } = require('@northscaler/error-support')

const { servicifyOutcomeOf } = require('../../../main').service
const { ResponseStatus } = require('../../../main').enums

const BadError = CodedError({ name: 'BadError' })

describe('unit tests of servicifyOutcomeOf', () => {
  it('should create service response from dto', async function () {
    const dto = { my: 'dto' }

    const expected = {
      data: dto,
      meta: {
        status: ResponseStatus.SUCCESS.name
      }
    }

    const actual = await servicifyOutcomeOf({ fn: () => dto })

    expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
    delete actual.meta.elapsedMillis

    expect(actual).to.deep.equal(expected)
  })

  it('should create service response from error', async function () {
    const causeMsg = 'because'
    const msg = 'message'
    const code = BadError.CODE

    const expected = {
      error: {
        cause: {
          message: causeMsg,
          name: 'Error'
        },
        code,
        message: `${code}: ${msg}: ${causeMsg}`,
        name: 'BadError'
      },
      meta: {
        status: ResponseStatus.FAILURE.name
      }
    }

    const actual = await servicifyOutcomeOf({
      fn: () => throw new BadError({ msg, cause: new Error(causeMsg) })
    })

    expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
    delete actual.meta.elapsedMillis

    expect(actual?.error?.stack).to.be.ok()
    expect(actual?.error?.cause?.stack).to.be.ok()
    delete actual.error.stack
    delete actual.error.cause.stack

    expect(actual).to.deep.equal(expected)
  })
})
