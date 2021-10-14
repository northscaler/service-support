import ResponseStatus from '../enums/ResponseStatus'
import DateFormat from '../enums/DateFormat'
import {
  ErrorLiteral,
  formatDate as defaultDateFormatter,
  formatEnumeration as defaultEnumerationFormatter,
  formatError as defaultErrorFormatter,
  formatPrimitive,
  formatPrimitive as defaultPrimitiveFormatter,
} from '../formatters'
import { Enumeration } from '@northscaler/better-enum'
import { IllegalArgumentError } from '@northscaler/better-error'

let nanoTime: () => bigint

async function getNanoTimeFn() {
  const process = await import('process')
  return () => process.hrtime.bigint()
}

getNanoTimeFn()
  .then((fn) => {
    nanoTime = fn
  })
  .catch(() => {
    // gulp
  })

export interface SecurityContextualizable<ContextType = any> {
  context?: ContextType
}

export interface ServiceMethodRequestMetadata<ContextType = any>
  extends SecurityContextualizable<ContextType> {
  /**
   * A UUID used to trace activity as it flows through messages & service calls.
   * May be the same as or different from `correlationId`.
   */
  traceId?: string
  /**
   * A unique token, often a UUID, received externally in a request that is
   * meant to be returned in a response so that the requestor can associate the
   * response with their request.
   */
  correlationId?: string
}

export interface ServiceMethodRequest<
  RequestDataType = any,
  ContextType = any
> {
  data?: RequestDataType
  meta?: ServiceMethodRequestMetadata<ContextType>
}

export interface ServiceMethodResponseMetadata {
  status: ResponseStatus
  /** A UUID used to trace activity. May be the same as or different from `correlationId`. */
  traceId?: string
  /** A token given to a call from an external source so that */
  correlationId?: string
  /** Number of milliseconds elapsed during servicing of request. */
  elapsedMillis: number
  /**
   * Number of nanoseconds elapsed during servicing of request. This is a
   * `string` instead of a `bigint` in order to be portable; format by default
   * is to append an `n`, for example `1234n`
   */
  elapsedNanos?: string
}

export interface ServiceMethodResponse<ResponseDataType = any> {
  data?: ResponseDataType
  meta: ServiceMethodResponseMetadata
}

export interface ServiceMethodErrorResponse<ResponseDataType = any>
  extends ServiceMethodResponse<ResponseDataType> {
  error?: ErrorLiteral
}

/**
 * A service method is a function that
 *
 * - Takes a {@link ServiceMethodRequest},
 * - Returns a response, and
 * - Does not throw any errors.
 *
 * NOTE: If a service method throws, it is a bug.
 *
 * All data types must be portable to maximize interoperability. This means, at
 * minimum, that dates and/or times should be converted to their ISO-8601 string
 * representations.
 */
export type ServiceMethod<
  RequestDataType = any,
  ResponseDataType = any,
  ContextType = any
> = (
  request: ServiceMethodRequest<RequestDataType, ContextType>
) => Promise<ServiceMethodResponse<ResponseDataType>>

/**
 * Specification of how to format a value that is either `typeof` the
 * specification's `typeOf` property or `instanceof` the specification's
 * `instanceOf` property. The specification's `formatter` property formats and
 * returns the given argument.
 *
 * Specifications *must* populate either `typeOf` or `instanceOf`.
 */
export interface FormatterSpec<T = any> {
  // NOTE: must have either instanceOf or typeOf present to be valid
  instanceOf?: T // literally Error, Date, etc; will be used as right operand of instanceof when formatting
  typeOf?: string // literally 'string', 'number', 'bigint', etc; will be used as operand of typeof when formatting
  formatter: (it: T) => ErrorLiteral | string | boolean | null | undefined
}

/**
 * Recursively formats the given value using the given {@link FormatterSpec}s.
 *
 * @param value The value to be formatted.
 * @param [formatters] The {@link FormatterSpec} objects used to format `value`.
 *   If falsey or an empty array, defaults to the {@link FormatterSpec}s returned
 *   by {@link createDefaultFormatters}.
 */
export function formatValuesIn({
  value,
  formatters,
}: {
  value: any
  formatters?: FormatterSpec[]
}): any {
  if (Array.isArray(value)) {
    return value.map((it) => formatValuesIn({ value: it, formatters }))
  }

  for (const formatter of formatters || []) {
    if (!(formatter.typeOf || formatter.instanceOf)) {
      throw new IllegalArgumentError({
        message:
          'neither instanceOf nor typeOf present; must have one or the other',
        context: { formatter },
      })
    }

    if (
      (formatter.typeOf && typeof value === formatter.typeOf) ||
      (formatter.instanceOf && value instanceof formatter.instanceOf)
    ) {
      return formatter.formatter(value)
    }
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
 * Creates default {@link FormatterSpec}s.
 *
 * @param [includeErrorStacks=false] Whether to include error stacks. Default is `false`
 * @param [includeErrorCauses=false] Whether to include error causes. Default is `false`
 * @param [dateFormat=DateFormat#ISO_8601] The default {@link DateFormat}.
 *   Defaults to {@link DateFormat#ISO_8601}. Default is `DateFormat#ISO_8601`
 * @param [useEnumerationNames=true] If `true`, {@link Enumeration}s will be
 *   formatted by their {@link Enumeration#name}, else by their
 *   {@link Enumeration#ordinal}. Default is `true`
 */
function createDefaultFormatters({
  includeErrorStacks = false,
  includeErrorCauses = false,
  dateFormat = DateFormat.ISO_8601,
  useEnumerationNames = true,
}: {
  includeErrorStacks: boolean
  includeErrorCauses: boolean
  dateFormat: DateFormat
  useEnumerationNames: boolean
}): FormatterSpec[] {
  const formatters: FormatterSpec[] = [
    {
      instanceOf: Error,
      formatter: (error: Error) =>
        defaultErrorFormatter({
          error,
          includeStack: includeErrorStacks,
          includeCause: includeErrorCauses,
        }),
    },
    {
      instanceOf: Date,
      formatter: (date: Date) =>
        defaultDateFormatter({
          date,
          format: dateFormat,
        }),
    },
    {
      instanceOf: Enumeration,
      formatter: (enumeration: Enumeration<any>) =>
        defaultEnumerationFormatter({
          enumeration,
          useName: useEnumerationNames,
        }),
    },
  ]

  ;[
    'string',
    'boolean',
    'number',
    'bigint',
    'symbol',
    'null',
    'undefined',
  ].forEach((it) => {
    const fs: FormatterSpec = {
      typeOf: it,
      formatter: defaultPrimitiveFormatter,
    }
    formatters.push(fs)
  })

  return formatters
}

export interface PortableTiming {
  /** The number of elapsed milliseconds. */
  elapsedMillis: number
  /**
   * If the underlying platform supports it, then the number of elapsed
   * nanoseconds as a string with a trailing `n` (for example, `42n`).
   *
   * This is of type `string` because not all platforms support JavaScript's `bigint`.
   */
  elapsedNanos?: string
}

/**
 * Calculates the time elapsed between the given instants.
 *
 * @param begin If of type `number`, the begin instant in Unix milliseconds
 *   since the epoch. If of type `bigint`, the begin instant in Unix nanoseconds
 *   since the epoch.
 * @param formatter
 * @param [end] If of type `number`, the end instant in Unix milliseconds since
 *   the epoch. If of type `bigint`, the end instant in Unix nanoseconds since
 *   the epoch. Defaults to the current instant in nanoseconds, or, if
 *   unavailable, in milliseconds.
 */
export function elapsedTime({
  begin,
  end,
  formatter = (n?: bigint) =>
    n === undefined ? undefined : (formatPrimitive(n) as string),
}: {
  begin: number | bigint
  end?: number | bigint | null
  formatter?: (n?: bigint) => string | undefined
}): PortableTiming {
  const actualEnd: number | bigint =
    end === undefined || end == null
      ? (nanoTime ? nanoTime() : Date.now())!
      : end

  let elapsedNanos: bigint | undefined
  let elapsedMillis: number | undefined

  if (typeof actualEnd === 'bigint') {
    elapsedNanos = (actualEnd as bigint) - (begin as bigint)
    elapsedMillis = Math.floor(Number(elapsedNanos) / 1_000_000)
  } else {
    elapsedMillis = (actualEnd as number) - (begin as number)
  }

  return {
    elapsedMillis,
    elapsedNanos: formatter(elapsedNanos),
  }
}

export const servicify = <RequestDataType, ResponseDataType, ContextType>(
  fn: (
    request?: RequestDataType,
    context?: ContextType
  ) => Promise<ResponseDataType>,
  {
    formatters,
    includeErrorStacks = true,
    includeErrorCauses = true,
    dateFormat = DateFormat.ISO_8601,
    useEnumerationNames = true,
  }: {
    formatters?: FormatterSpec[]
    includeErrorStacks?: boolean
    includeErrorCauses?: boolean
    dateFormat?: DateFormat
    useEnumerationNames?: boolean
  } = {}
): ServiceMethod<RequestDataType, ResponseDataType, ContextType> => {
  return (
    serviceMethodRequest: ServiceMethodRequest<RequestDataType, ContextType>
  ) =>
    servicifyOutcomeOf(
      () => fn(serviceMethodRequest?.data, serviceMethodRequest?.meta?.context),
      {
        formatters,
        includeErrorStacks,
        includeErrorCauses,
        dateFormat,
        useEnumerationNames,
      }
    )
}

export const servicifyOutcomeOf = async <
  ResponseDataType = any,
  ContextType = any
>(
  fn: () => Promise<ResponseDataType>,
  {
    formatters,
    includeErrorStacks = true,
    includeErrorCauses = true,
    dateFormat = DateFormat.ISO_8601,
    useEnumerationNames = true,
  }: {
    formatters?: FormatterSpec[]
    includeErrorStacks?: boolean
    includeErrorCauses?: boolean
    dateFormat?: DateFormat
    useEnumerationNames?: boolean
  }
): Promise<ServiceMethodResponse<ResponseDataType>> => {
  const actualFormatters: FormatterSpec[] = (formatters ||
    createDefaultFormatters({
      includeErrorStacks,
      includeErrorCauses,
      dateFormat,
      useEnumerationNames,
    })) as FormatterSpec[]

  const begin: number | bigint = (nanoTime ? nanoTime() : Date.now())!

  try {
    const value = await fn()

    const elapsed = elapsedTime({ begin })

    const response: ServiceMethodResponse<ResponseDataType> = {
      data: formatValuesIn({
        value,
        formatters: actualFormatters,
      }) as ResponseDataType,
      meta: {
        status: ResponseStatus.SUCCESS,
        ...elapsed,
      },
    }
    return response
  } catch (e) {
    const elapsed = elapsedTime({ begin })

    const response: ServiceMethodErrorResponse<ResponseDataType> = {
      error: formatValuesIn({
        value: e,
        formatters: actualFormatters,
      }) as ErrorLiteral,
      meta: {
        status: ResponseStatus.FAILURE,
        ...elapsed,
      },
    }
    return response
  }
}

/**
 * Extracts the state from the given entity. This could be used to return a
 * [data transfer object
 * (DTO)](https://martinfowler.com/eaaCatalog/dataTransferObject.html) or a
 * document suitable for storage in a document database. The entity normally is
 * an instance of a class with data properties whose names holding the desired
 * state begin with the underscore character (`_`). By default, this will
 * descend recursively through the given object and drop the leading underscore
 * prefix from its keys and convert any convertible values, mainly `Date`s to
 * ISO-8601 strings and [`Enumeration`
 * instances](https://www.npmjs.com/package/@northscaler/enum-support) to just
 * their `name`s. All methods found are excluded from the returned object. Each
 * formatter is customizable.
 *
 * @param entity The entity from which to extract a data transfer object (DTO).
 * @param [keyReplacementRegEx=/^_/] The key replacement regular expression
 *   given to the `replace` method of `String`; if falsey, no key replacement is
 *   performed. Default is `/^_/`
 * @param [keyReplacement=''] The key replacement given to the `replace` method
 *   of `String`. Default is `''`
 * @param [dateFormatter] The default `Date` formatter; defaults to ISO-8601.
 * @param [enumerationFormatter] The formatter of [`Enumeration`
 *   instances](https://www.npmjs.com/package/@northscaler/enum-support);
 *   defaults to returning the enumeration's `name`.
 */
export function extractStateFromEntity(
  entity: any,
  {
    keyReplacementRegEx = /^_/,
    keyReplacement = '',
    dateFormatter = (date) =>
      defaultDateFormatter({ date, format: DateFormat.ISO_8601 }),
    enumerationFormatter = (enumeration) =>
      defaultEnumerationFormatter({ enumeration, useName: true }),
  }: {
    keyReplacementRegEx?: RegExp | null
    keyReplacement?: string
    dateFormatter?: (date: Date) => string
    enumerationFormatter?: (e: Enumeration<any>) => string
  } = {}
): any {
  // this function makes the code below more readable
  function recurse(entity: any) {
    return extractStateFromEntity(entity, {
      keyReplacementRegEx,
      keyReplacement,
      dateFormatter,
      enumerationFormatter,
    })
  }

  if (!entity) return entity
  if (Array.isArray(entity)) return entity.map((it) => recurse(it))
  if (entity instanceof Enumeration) return enumerationFormatter(entity)
  if (typeof entity !== 'object') return entity

  return Object.keys(entity).reduce((dto: any, key) => {
    const newKey = keyReplacementRegEx
      ? key.replace(keyReplacementRegEx, keyReplacement)
      : key

    const type = typeof entity[key]
    if (!entity[key]) dto[newKey] = entity[key]
    else if (Array.isArray(entity[key]))
      dto[newKey] = entity[key].map((it: any) => recurse(it))
    else if (entity[key] instanceof Date)
      dto[newKey] = dateFormatter(entity[key])
    else if (entity[key] instanceof Enumeration)
      dto[newKey] = enumerationFormatter(entity[key])
    else if (type === 'object') dto[newKey] = recurse(entity[key])
    else if (type !== 'function') dto[newKey] = entity[key] // skip functions

    return dto
  }, {})
}
