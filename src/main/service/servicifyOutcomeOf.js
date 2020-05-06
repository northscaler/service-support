'use strict'

const ResponseStatus = require('../enums/ResponseStatus')
const defaultErrorFormatter = require('../formatters/formatError')

/**
 * Function used to execute the given function in a `try`/`catch` block.
 * If the function returns normally, the return value is wrapped in a service response object with the following shape:
 * ```
 * {
 *   data: <function return value>,
 *   meta: {
 *     status: ResponseStatus.SUCCESS,
 *     elapsedMillis: n
 *   }
 * }
 * ```
 * If the function throws, the `Error` is caught, and formatted as a service response object with the following shape:
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
 * @param {object} arg0 The argument to be deconstructed.
 * @param {function} fn The function to be called.
 * @param {boolean} [includeErrorStack=true] Whether to include the `Error` `stack` property if one is thrown.
 * @param {boolean} [includeErrorCause=true] Whether to include the `Error` `cause` property if one is thrown.
 * @param {function} [errorFormatter] Function to convert the `Error` object to a plain object; one is provided by default.
 * @return {Promise<{meta: {elapsedMillis: number, status: *}, error: *}|{data: *, meta: {elapsedMillis: number, status: *}}>}
 */
async function servicifyOutcomeOf ({
  fn,
  includeErrorStack = true,
  includeErrorCause = true,
  errorFormatter = defaultErrorFormatter
} = {}) {
  const begin = Date.now()

  try {
    return {
      data: await fn(),
      meta: {
        status: ResponseStatus.SUCCESS.name,
        elapsedMillis: Date.now() - begin
      }
    }
  } catch (e) {
    return {
      error: errorFormatter({
        error: e,
        includeStack: includeErrorStack,
        includeCause: includeErrorCause
      }),
      meta: {
        status: ResponseStatus.FAILURE.name,
        elapsedMillis: Date.now() - begin
      }
    }
  }
}

module.exports = servicifyOutcomeOf
