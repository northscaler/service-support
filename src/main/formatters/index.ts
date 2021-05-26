import { DateFormat } from '../enums'
import { Enumeration } from '@northscaler/better-enum'

/**
 * Formats the given date using the given `DateFormat` enum.
 *
 * @param {object} [arg0] The argument to be deconstructed.
 * @param {Date} [date] The `Date` to be formatted; if not a Date, the value is
 *   returned unchanged.
 * @param {DateFormat} [format=DateFormat.ISO_8601] The `DateFormat` enum value
 *   to use to format `date`. Default is `DateFormat.ISO_8601`
 * @returns {string | number} The formatted date.
 */
export function formatDate({
  date,
  format = DateFormat.ISO_8601,
}: {
  date: Date
  format: DateFormat
}) {
  return format.format(date)
}

/**
 * Formats the given
 * (enumeration)[https://www.npmjs.com/package/@northscaler/better-enum].
 *
 * @param enumeration The enumeration instance to format.
 * @param useName Whether to use the `name` or `ordinal` of the enumeration;
 *   default `true`.
 */
export function formatEnumeration({
  enumeration,
  useName = true,
}: {
  enumeration: Enumeration<any>
  useName: boolean
}): string {
  return useName ? enumeration.name() : enumeration.ordinal().toString(10)
}

export interface ErrorLiteral {
  name?: string
  message?: string
  code?: string
  info?: any
  stack?: string
  cause?: ErrorLiteral | ErrorLiteral[]
}

export function formatError({
  error,
  includeStack = true,
  includeCause = true,
}: {
  error: any
  includeStack: boolean
  includeCause: boolean
}): ErrorLiteral {
  const literal: ErrorLiteral = {}

  if (error.name) literal.name = error.name.toString()
  if (error.message) literal.message = error.message.toString()
  if (error.code) literal.code = error.code.toString()
  if (error.info) literal.info = error.info

  if (includeStack && error.stack) literal.stack = error.stack.toString()

  if (includeCause && error.cause) {
    literal.cause = Array.isArray(error.cause)
      ? error.cause.map((it: any) =>
          formatError({
            error: it,
            includeStack,
            includeCause,
          })
        )
      : formatError({
          error: error.cause,
          includeStack,
          includeCause,
        })
  }

  return literal
}

export function formatPrimitive(
  it: string | boolean | number | bigint | symbol | null | undefined
) {
  if (it === null) {
    return null
  }

  switch (typeof it) {
    case 'bigint':
      return `${it}n`
    case 'undefined':
      return undefined
    case 'symbol':
      return `${it.description || 'Symbol'}`
    case 'boolean':
    case 'string':
      return it
    default:
      return String(it)
  }
}
