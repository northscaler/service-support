'use strict'

const Enumeration = require('@northscaler/enum-support')

/**
 * Enumeration object of service response statuses.
 */
const ResponseStatus = Enumeration.new({
  name: 'ResponseStatus',
  values: [
    'FAILURE',
    'SUCCESS',
    'PARTIAL'
  ]
})

module.exports = ResponseStatus
