'use strict'

const { AsyncAround } = require('@northscaler/aspectify')
const servicifyOutcomeOf = require('../service/servicifyOutcomeOf')
const DateFormat = require('../enums/DateFormat')

/**
 * Decorator used to execute the decorated method in a `try`/`catch` block.
 * Use on service class methods only.
 * If the method returns normally, the return value is wrapped in a service response object with the following shape:
 *
 * ```
 * {
 *   data: <method return value>,
 *   meta: {
 *     status: ResponseStatus.SUCCESS,
 *     elapsedMillis: n
 *   }
 * }
 * ```
 *
 * If the method throws, the `Error` is caught, and formatted as a service response object with the following shape:
 * ```
 * {
 *   error: {
 *     name: ...,
 *     message: ...,
 *     code: ...,
 *     info: ...,
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
 * @param {Formatter[]} [arg0.formatters] Formatters to be used when formatting values in returned objects or thrown `Error`s.
 * @param {boolean} [arg0.includeErrorStacks=true] Whether to include the `Error` `stack` property if one is thrown or there are `Error`s in the return value.
 * Ignored if `formatters` is given.
 * @param {boolean} [arg0.includeErrorCauses=true] Whether to include the `Error` `cause` property if one is thrown or there are `Error`s in the return value.
 * Ignored if `formatters` is given.
 * @param {DateFormat} [arg0.dateFormat=DateFormat.ISO_8601] The date format to use.
 * Ignored if `formatters` is given.
 */
const serviceMethod = ({
  formatters,
  includeErrorStacks = true,
  includeErrorCauses = true,
  dateFormat = DateFormat.ISO_8601
} = {}) =>
  AsyncAround(async ({ thisJoinPoint }) => servicifyOutcomeOf({
    fn: thisJoinPoint.proceed,
    formatters,
    includeErrorStacks,
    includeErrorCauses,
    dateFormat
  }))

module.exports = serviceMethod
