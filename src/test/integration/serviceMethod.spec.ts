/* global describe, it */

import chai from 'chai'
import { DateFormat } from '../../main/enums'
import {
  BetterError,
  BetterErrorConstructorArg,
} from '@northscaler/better-error'
import { ServiceMethodRequest, ServiceMethodResponse } from '../../main/service'

const expect = chai.expect

class OopsyError extends BetterError {
  constructor(arg: BetterErrorConstructorArg) {
    super()
  }
}

type TimestampedSum = {
  sum: number
  at: string
}

interface AdditionRequest {
  a: number
  b: number
  at?: Date
}

interface ITimestampedAdditionService {
  add(
    req: ServiceMethodRequest<AdditionRequest, TimestampedSum>
  ): Promise<ServiceMethodResponse<TimestampedSum>>
}

class PlainTimestampedAdditionService {
  constructor(public dateFormat: DateFormat) {}

  async add({
    a,
    b,
    at = new Date(),
  }: {
    a: number
    b: number
    at?: Date
  }): Promise<TimestampedSum> {
    return { sum: a + b, at: this.dateFormat.format(at) }
  }
}

class PlainTimestampedAdditionServiceAdapter
  implements ITimestampedAdditionService {
  protected delegate: PlainTimestampedAdditionService

  constructor(public dateFormat: DateFormat) {
    this.delegate = new PlainTimestampedAdditionService(dateFormat)
  }

  async add(
    req: ServiceMethodRequest<AdditionRequest, TimestampedSum>
  ): Promise<ServiceMethodResponse<TimestampedSum>> {}
}

// const adder = new AdditionService()
//
// describe('integration tests of @serviceMethod', () => {
//   it('should return successful response', async function () {
//     const dto = { a: 1, b: 2, at: new Date() }
//
//     const expected = {
//       data: { sum: dto.a + dto.b, at: dto.at.toISOString() },
//       meta: {
//         status: ResponseStatus.SUCCESS.name,
//       },
//     }
//
//     let actual = await adder.add(dto)
//     console.log(JSON.stringify(actual, null, 2))
//
//     expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
//     delete actual.meta.elapsedMillis
//
//     expect(actual).to.deep.equal(expected)
//
//     expected.data.at = dto.at.getTime()
//
//     actual = await adder.addWithUnixMillisecondsFormat(dto)
//     console.log(JSON.stringify(actual, null, 2))
//
//     expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
//     delete actual.meta.elapsedMillis
//
//     expect(actual).to.deep.equal(expected)
//   })
//
//   it('should return error response', async function () {
//     const dto = { a: 1, b: 'foo' }
//
//     const expected = {
//       error: {
//         name: 'Oopsy',
//         message: 'E_OOPSY: arguments not both numbers',
//         code: 'E_OOPSY',
//       },
//       meta: {
//         status: ResponseStatus.FAILURE.name,
//       },
//     }
//
//     let actual = await adder.add(dto)
//
//     expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
//     delete actual.meta.elapsedMillis
//
//     expect(typeof actual?.error?.stack).to.equal('string')
//     delete actual.error.stack
//
//     expect(actual).to.deep.equal(expected)
//
//     actual = await adder.addNoStacktrace(dto)
//     console.log(JSON.stringify(actual, null, 2))
//
//     expect(actual?.meta?.elapsedMillis).to.be.at.least(0)
//     delete actual.meta.elapsedMillis
//
//     expect(actual?.error?.stack).not.to.be.ok()
//
//     expect(actual).to.deep.equal(expected)
//   })
// })
