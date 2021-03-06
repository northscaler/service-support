# `@northscaler/service-support`
Make services act like services!

## Overview
A service layer has certain characteristics:
* It is request/response in nature.
* Its methods are usually coarse-grained.
* Its methods never throw `Error`s; they return responses indicating failure.
* Its methods accept & return data transfer objects (DTOs), that usually
  * are devoid of any behavior, and
  * contain portable data types only, making them amenable to serialization.
* Its methods usually scope a complete unit of work (AKA transaction); as such, it is usually a transaction boundary.

These characteristics place a burden on developers, most of which is boilerplate code and can be automated.

This library provides
* a `ResponseStatus` enum,
* default `Error` & `Date` formatters,
* helpful service method wrappers that take care of returning success & failure response objects,
* a decorator that uses aforementioned method to allow for service methods to return conventional return values & throw exceptions that get translated to proper service responses, freeing developers from having to write such boilerplate code and ensuring errors don't leak past the service boundary.

## TL;DR

Install `@northscaler/service-support`:
```bash
$ npm i --save @northscaler/service-support
```

Write a service class:
```javascript
const { serviceMethod } = require('@northscaler/service-support').decorators
const { CodedError } = require('@northscaler/error-support')

const OopsyError = CodedError({ name: 'Oopsy' })

class AdditionService {
  @serviceMethod({ includeErrorStacks: process.env.NODE_ENV === 'production' })
  async add ({ a, b }) {
    if (typeof a !== 'number' || typeof b !== 'number') throw new OopsyError({
      msg: 'arguments not both numbers',
      cause: new Error('RTFM')
    })

    return a + b
  }
}
```

Observe service responses instead of return values or thrown `Error`s:
```javascript
const service = new AdditionService()

console.log(JSON.stringify(service.add({a: 1, b: 2})), null, 2)
// logs:
// {
//   "data": 3,
//   "meta": {
//     "status": "SUCCESS",
//     "elapsedMillis": 1
//   }
// }

console.log(JSON.stringify(service.add({a: "1", b: 2})), null, 2)
// does not throw & logs:
// {
//   "error": {
//     "name": "Oopsy",
//     "message": "E_OOPSY: arguments not both numbers: RTFM",
//     "code": "E_OOPSY",
//     "cause": {
//       "name": "Error",
//       "message": "RTFM"
//     }
//   },
//   "meta": {
//     "status": "FAILURE",
//     "elapsedMillis": 1
//   }
// }
```

## Enumerations
Import/require from `enums`.

* `DateFormat`: convenient enum that includes a `format` method to format `Date`s.
* `ResponseStatus`: indicates the outcome of a service method call, with values `SUCCESS`, `FAILURE` & `PARTIAL` (for bulk operations).

## Service implementation helpers
Import/require from `service`.

* `extractDtoFromEntity`: Extracts the state from a persistent entity.
See docs for more information.
* `servicifyOutcomeOf`: The actual advice used by the `@serviceMethod` decorator.
See docs for more information.
