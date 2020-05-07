'use strict'

const ResponseStatus = require('../enums/ResponseStatus')
const defaultErrorFormatter = require('../formatters/error-formatter')
const defaultDateFormatter = require('../formatters/date-formatter')
const DateFormat = require('../enums/DateFormat')

function formatValuesIn ({
  value,
  formatters
} = {}) {
  if (!value) return value

  if (Array.isArray(value)) return value.map(it => formatValuesIn({ value: it, formatters }))

  for (const formatter of formatters) {
    if (value instanceof formatter.type) return formatter.formatter(value)
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce((accum, next) => {
      value[next] = formatValuesIn({ value: value[next], formatters })
      return accum
    }, value)
  }

  return value
}

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
 * @private
 * @param {object} arg0 The argument to be deconstructed.
 * @param {function} arg0.fn The function to be called.
 * @param {Formatter[]} [arg0.formatters] Formatters to be used when formatting values in returned objects or thrown `Error`s.
 * Shape is `{ type, formatter }`, where `type` is a type like `Date`, `Error`, etc and `formatter` is the formatting function.
 * Example: `{ type: Date, formatter: date => date.toString() }`.
 * Appropriate defaults are provided.
 * @param {boolean} [arg0.includeErrorStacks=true] Whether to include the `Error` `stack` property if one is thrown or there are `Error`s in the return value.
 * Ignored if `formatters` is given.
 * @param {boolean} [arg0.includeErrorCauses=true] Whether to include the `Error` `cause` property if one is thrown or there are `Error`s in the return value.
 * Ignored if `formatters` is given.
 * @param {DateFormat} [arg0.dateFormat=DateFormat.ISO_8601] The date format to use.
 * Ignored if `formatters` is given.
 * @return {Promise<{meta: {elapsedMillis: number, status: *}, error: *}|{data: *, meta: {elapsedMillis: number, status: *}}>}
 */
async function servicifyOutcomeOf ({
  fn,
  formatters,
  includeErrorStacks = true,
  includeErrorCauses = true,
  dateFormat = DateFormat.ISO_8601
} = {}) {
  const begin = Date.now()

  formatters = formatters || [{
    type: Error,
    formatter: error => defaultErrorFormatter({
      error,
      includeStack: includeErrorStacks,
      includeCause: includeErrorCauses
    })
  }, {
    type: Date,
    formatter: date => defaultDateFormatter({
      date,
      format: dateFormat
    })
  }]
  formatters = Array.isArray(formatters) ? formatters : [formatters]

  try {
    return {
      data: formatValuesIn({ value: await fn(), formatters }),
      meta: {
        status: ResponseStatus.SUCCESS.name,
        elapsedMillis: Date.now() - begin
      }
    }
  } catch (e) {
    return {
      error: formatValuesIn({ value: e, formatters }),
      meta: {
        status: ResponseStatus.FAILURE.name,
        elapsedMillis: Date.now() - begin
      }
    }
  }
}

module.exports = servicifyOutcomeOf
