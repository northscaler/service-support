'use strict'

const Enumeration = require('@northscaler/enum-support')

/**
 * Enumeration object of date formats
 */
const DateFormat = Enumeration.new({
  name: 'DateFormat',
  values: [
    'ISO_8601',
    'UNIX_MILLISECONDS',
    'UNIX_SECONDS'
  ]
}, {
  format (date) {
    if (!date) return date
    if (!(date instanceof Date)) return date

    switch (this) {
      case DateFormat.ISO_8601:
        return date.toISOString()
      case DateFormat.UNIX_MILLISECONDS:
        return date.getTime()
      case DateFormat.UNIX_SECONDS:
        return date.getTime() / 1000
      default:
        throw new DateFormat.$ERROR$()
    }
  }
})

module.exports = DateFormat
