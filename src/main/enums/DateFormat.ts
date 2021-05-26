import { _of, _values, Enumeration } from '@northscaler/better-enum'
import { IllegalArgumentError } from '@northscaler/better-error'

let ordinal = 0

export default class DateFormat extends Enumeration<DateFormat> {
  static readonly ISO_8601 = new DateFormat('ISO_8601', ordinal++)
  static readonly UNIX_MILLISECONDS = new DateFormat(
    'UNIX_MILLISECONDS',
    ordinal++
  )
  static readonly UNIX_SECONDS = new DateFormat('UNIX_SECONDS', ordinal++)
  static readonly LOCALE = new DateFormat('LOCAL', ordinal++)
  static readonly LOCALE_DATE = new DateFormat('LOCALE_DATE', ordinal++)
  static readonly LOCALE_TIME = new DateFormat('LOCALE_TIME', ordinal++)
  static readonly DEFAULT = new DateFormat('DEFAULT', ordinal++)

  static of(it: DateFormat | string | number): DateFormat {
    return _of(it, DateFormat)
  }

  static values(): DateFormat[] {
    return _values<DateFormat>(DateFormat)
  }

  private constructor(name: string, ordinal: number) {
    super(name, ordinal, DateFormat)
  }

  format(date: Date): string {
    switch (this) {
      case DateFormat.ISO_8601:
        return date.toISOString()
      case DateFormat.UNIX_MILLISECONDS:
        return String(date.getTime())
      case DateFormat.UNIX_SECONDS:
        return String(date.getTime() / 1000)
      case DateFormat.LOCALE:
        return date.toLocaleString()
      case DateFormat.LOCALE_DATE:
        return date.toLocaleDateString()
      case DateFormat.LOCALE_TIME:
        return date.toLocaleTimeString()
      default:
        // DateFormat.DEFAULT
        return date.toString()
    }
  }

  /**
   * Returns a `Date` parsed from the given value.
   *
   * @param value
   * @throws {@link IllegalArgumentError} If the value is can't be parsed.
   */
  parse(value: string | number) {
    const millis = Date.parse(String(value))

    if (isNaN(millis)) {
      throw new IllegalArgumentError({
        message: 'date value cannot be parsed',
        context: { value },
      })
    }

    return new Date(millis)
  }
}
