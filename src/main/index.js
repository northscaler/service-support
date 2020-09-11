'use strict'

module.exports = {
  decorators: require('./aspects'),
  enums: require('./enums'),
  service: require('./service'),
  /**
   * @deprecated Use require('@northscaler/service-support').decorators
   */
  aspects: require('./aspects'),
  /**
   * @deprecated Use require('@northscaler/service-support').decorators.serviceMethod
   */
  serviceMethod: require('./aspects/serviceMethod'),
  /**
   * @deprecated Use require('@northscaler/service-support').service.servicifyOutcomeOf
   */
  servicifyOutcomeOf: require('./service/servicifyOutcomeOf'),
  /**
   * @deprecated Not intended for public use
   */
  errorFormatter: require('./formatters/error-formatter'),
  /**
   * @deprecated Not intended for public use
   */
  dateFormatter: require('./formatters/date-formatter'),
  /**
   * @deprecated Use require('@northscaler/service-support').enums.ResponseStatus
   */
  ResponseStatus: require('./enums/ResponseStatus'),
  /**
   * @deprecated Use require('@northscaler/service-support').enums.DateFormat
   */
  DateFormat: require('./enums/DateFormat')
}
