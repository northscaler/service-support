'use strict'

const DateFormat = require('../enums/DateFormat')

/**
 * Formats the given date using the given `DateFormat` enum.
 *
 * @param {object} [arg0] The argument to be deconstructed.
 * @param {Date} [date] The `Date` to be formatted; if not a Date, the value is returned unchanged.
 * @param {DateFormat} [format=DateFormat.ISO_8601] The `DateFormat` enum value to use to format `date`.
 * @return {string|number} The formatted date.
 */
function formatDate ({
  date,
  format = DateFormat.ISO_8601
} = {}) {
  return format.format(date)
}

module.exports = formatDate
