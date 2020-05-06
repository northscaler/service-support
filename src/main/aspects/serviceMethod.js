'use strict'

const { AsyncAround } = require('@northscaler/aspectify')
const servicifyOutcomeOf = require('../service/servicifyOutcomeOf')

/**
 * Decorator used to execute the decorated method in a `try`/`catch` block.
 * If the method returns normally, the return value is wrapped in a service response object with the following shape:
 * ```
 * {
 *   data: <method return value>,
 *   meta: {
 *     status: ResponseStatus.SUCCESS,
 *     elapsedMillis: n
 *   }
 * }
 * ```
 * If the method throws, the `Error` is caught, and formatted as a service response object with the following shape:
 * ```
 * {
 *   error: {
 *     name: ...,
 *     message: ...,
 *     code: ...,
 *     cause: ...,
 *     stack: ...,
 *   },
 *   meta: {
 *     status: ResponseStatus.FAILURE,
 *     elapsedMillis: n
 *   }
 * }
 * ```
 *
 * @param {object} [arg0] The argument to be deconstructed.
 * @param {boolean} [includeErrorStack=true] Whether to include `Error` `stack`traces.
 * @param {boolean} [includeErrorCause=true] Whether to include `Error` `cause`s.
 */
const serviceMethod = ({
  includeErrorStack = true,
  includeErrorCause = true
} = {}) =>
  AsyncAround(async ({ thisJoinPoint }) => servicifyOutcomeOf({
    fn: thisJoinPoint.proceed,
    includeErrorStack,
    includeErrorCause
  }))

module.exports = serviceMethod
