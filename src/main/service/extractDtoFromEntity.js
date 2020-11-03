'use strict'

const formatDate = require('../formatters/date-formatter')
const formatEnumeration = require('../formatters/enumeration-formatter')
const DateFormat = require('../enums/DateFormat')
const Enumeration = require('@northscaler/enum-support')

/**
 * Extracts a [data transfer object (DTO)](https://martinfowler.com/eaaCatalog/dataTransferObject.html) from the given entity.
 * The entity normally is an instance of a class with data properties whose names begin with the underscore character (`_`).
 * By default, this will descend recursively through the given object and drop the leading underscore prefix from its keys and convert any convertible values, mainly `Date`s to ISO-8601 strings and [`Enumeration` instances](https://www.npmjs.com/package/@northscaler/enum-support) to just their `name`s.
 * All methods found are excluded from the returned DTO.
 * Each formatter is customizable.
 *
 * @param {*} entity The entity from which to extract a data transfer object (DTO).
 * @param {object} arg1 The argument to be deconstructed.
 * @param {string|RegExp} [arg1.keyReplacementRegEx=/^_/] The key replacement regular expression given to the `replace` method of `String`; if falsey, no key replacement is performed.
 * @param {string|function} [arg1.keyReplacement=''] The key replacement given to the `replace` method of `String`.
 * @param {function} [arg1.dateFormatter] The formatter of `Date`s; defaults to `toISOString()` on `Date`.
 * @param {function} [arg1.enumerationFormatter] The formatter of [`Enumeration` instances](https://www.npmjs.com/package/@northscaler/enum-support); defaults to returning the `name`.
 */
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
  if (Array.isArray(entity)) return entity.map(it => recurse(it))
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
