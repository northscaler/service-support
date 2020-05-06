'use strict'

/**
 * @typedef {object} FormattedError
 * @property {string} [name]
 * @property {string} [message]
 * @property {string} [code]
 * @property {*} [info]
 * @property {string} [stack]
 * @property {object} [cause]
 */

/**
 * Formats the given error as a plain object.
 *
 * @param {object} [arg0] The argument to be deconstructed
 * @param {object} [error] The `Error` (or `Error`-like object) to be formatted
 * @param {boolean} [includeStack=true] Whether to include the `stack` property
 * @param {boolean} [includeCause=true] Whether to include the `cause` property
 * @return {FormattedError} The formatted error as a literal object
 */
function formatError ({
  error,
  includeStack = true,
  includeCause = true
} = {}) {
  if (!error) return error

  const e = { name: error.name }

  if (error.message) e.message = error.message.toString()
  if (error.code) e.code = error.code.toString()
  if (error.info) e.info = error.info

  if (includeStack && error.stack) e.stack = error.stack.toString()
  if (includeCause && error.cause) e.cause = formatError({ error: error.cause, includeStack, includeCause })

  return e
}

module.exports = formatError
