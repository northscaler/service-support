'use strict'

const formatDate = require('../formatters/date-formatter')
const formatEnumeration = require('../formatters/enumeration-formatter')
const DateFormat = require('../enums/DateFormat')
const Enumeration = require('@northscaler/enum-support')

function extractDtoFromEntity (entity, {
  keyReplacementRegEx = /^_/,
  keyReplacement = '',
  dateFormatter = date => formatDate({ date, format: DateFormat.ISO_8601 }),
  enumerationFormatter = enumeration => formatEnumeration({ enumeration, useName: true })
} = {}) {
  if (keyReplacementRegEx) keyReplacementRegEx = new RegExp(keyReplacementRegEx)

  function recurse (entity) { // makes the code below more readable
    return extractDtoFromEntity(entity, {
      keyReplacementRegEx,
      keyReplacement,
      dateFormatter,
      enumerationFormatter
    })
  }

  if (!entity) return entity
  if (Array.isArray(entity)) return entity.map(it => recurse(entity))
  if (Enumeration.isEnumerationInstance(entity)) return enumerationFormatter(entity)
  if (typeof entity !== 'object') return entity

  return Object.keys(entity).reduce((dto, key) => {
    const newKey = keyReplacementRegEx ? key.replace(keyReplacementRegEx, keyReplacement) : key

    const type = typeof entity[key]
    if (!entity[key]) dto[newKey] = entity[key]
    else if (Array.isArray(entity[key])) dto[newKey] = entity[key].map(it => recurse(it))
    else if (entity[key] instanceof Date) dto[newKey] = dateFormatter(entity[key])
    else if (Enumeration.isEnumerationInstance(entity[key])) dto[newKey] = enumerationFormatter(entity[key])
    else if (type === 'object') dto[newKey] = recurse(entity[key])
    else if (type !== 'function') dto[newKey] = entity[key] // skip functions

    return dto
  }, {})
}

module.exports = extractDtoFromEntity
