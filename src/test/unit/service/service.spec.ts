/* global describe, it */

import chai from 'chai'
import {
  BetterError,
  BetterErrorConstructorArg,
} from '@northscaler/better-error'
import { ResponseStatus } from '../../../main/enums'
import { extractStateFromEntity, servicify } from '../../../main/service'
import { _of, _values, Enumeration } from '@northscaler/better-enum'

const expect = chai.expect

class BadError extends BetterError {
  constructor(arg?: BetterErrorConstructorArg) {
    super(arg)
  }
}

let ordinal = 0

class Bool extends Enumeration<Bool> {
  static readonly FALSE = new Bool('FALSE', ordinal++)
  static readonly TRUE = new Bool('TRUE', ordinal++)

  static of(it: Bool | string | number): Bool {
    return _of(it, Bool)
  }

  static values(): Bool[] {
    return _values<Bool>(Bool)
  }

  private constructor(name: string, ordinal: number) {
    super(name, ordinal, Bool)
  }
}

describe('unit tests of extractStateFromEntity', () => {
  it('should work', async function () {
    const date = '2020/1/1'
    const entity = {
      _zero: false,
      _one: 1,
      _two: {
        three: 3, // throw one in that doesn't have the _ prefix
        _four: null,
        _five: undefined,
        _six: [
          6,
          -6,
          {
            _nine: 9,
          },
        ],
        _seven: new Date(date),
      },
      _eight: (it: any) => it,
      _ten: Bool.TRUE,
    }
    Object.defineProperty(entity, 'one', {
      get: function () {
        return this._one
      },
      set: function (v) {
        this._one = v
      },
    })

    expect(extractStateFromEntity(entity)).to.deep.equal({
      zero: false,
      one: 1,
      two: {
        three: 3,
        four: null,
        five: undefined,
        six: [6, -6, { nine: 9 }],
        seven: new Date(date).toISOString(),
      },
      ten: Bool.TRUE.name(),
    })

    expect(
      extractStateFromEntity(entity, {
        keyReplacementRegEx: null,
        dateFormatter: (it: Date) => `date:${it.toISOString()}`,
        enumerationFormatter: (it: Enumeration<any>) => `o${it.ordinal()}`,
      })
    ).to.deep.equal({
      _zero: false,
      _one: 1,
      _two: {
        three: 3,
        _four: null,
        _five: undefined,
        _six: [6, -6, { _nine: 9 }],
        _seven: 'date:' + new Date(date).toISOString(),
      },
      _ten: 'o1',
    })
  })
})

describe('unit tests of servicify', () => {
  it('should create service response from dto', async function () {
    interface Dto {
      my: string
    }

    interface Context {
      user?: string
    }

    const dto: Dto = { my: 'dto' }

    const expected = {
      data: dto,
      meta: {
        status: ResponseStatus.SUCCESS,
      },
    }

    const servicifiedMethod = servicify({ fn: async () => dto })
    const actual = await servicifiedMethod({})

    expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
    expect(actual.data).to.deep.equal(expected.data)
  })

  // it('should create service response from error', async function() {
  //   const causeMsg = 'because'
  //   const msg = 'message'
  //   const code = BadError.CODE
  //
  //   const expected = {
  //     error: {
  //       cause: {
  //         message: causeMsg,
  //         name: 'Error'
  //       },
  //       code,
  //       message: `${code}: ${msg}: ${causeMsg}`,
  //       name: 'BadError'
  //     },
  //     meta: {
  //       status: ResponseStatus.FAILURE.name
  //     }
  //   }
  //
  //   const actual = await servicifyOutcomeOf({
  //     fn: () => throw new BadError({ msg, cause: new Error(causeMsg) })
  //   })
  //
  //   expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
  //   delete actual.meta.elapsedMillis
  //
  //   expect(actual?.error?.stack).to.be.ok()
  //   expect(actual?.error?.cause?.stack).to.be.ok()
  //   delete actual.error.stack
  //   delete actual.error.cause.stack
  //
  //   expect(actual).to.deep.equal(expected)
  // })
})
