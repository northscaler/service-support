'use strict'

/**
 * Formats the given (enumeration)[https://www.npmjs.com/package/@northscaler/enum-support].
 *
 * @param {object} [arg0] The argument to be deconstructed.
 * @param {object} arg0.enumeration The `Enumeration` to be formatted.
 * @param {boolean} [arg0.useName=true] If truey, the the `name` of the `Enumeration` will be returned, else its `ordinal`.
 * @return {string} If `useName` is truey, the `name` of the `Enumeration`, else its `ordinal`.
 */
function formatEnumeration ({ enumeration, useName = true }) {
  return useName ? enumeration.name : enumeration.ordinal
}

module.exports = formatEnumeration
