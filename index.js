'use strict'

module.exports = PostgresInterval

function PostgresInterval (raw) {
  if (!(this instanceof PostgresInterval)) {
    return new PostgresInterval(raw)
  }

  Object.assign(this, parse(raw))
}
const properties = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']
PostgresInterval.prototype.toPostgres = function () {
  const filtered = properties.filter(key => Object.prototype.hasOwnProperty.call(this, key) && this[key] !== 0)

  // In addition to `properties`, we need to account for fractions of seconds.
  if (this.milliseconds && !filtered.includes('seconds')) {
    filtered.push('seconds')
  }

  if (filtered.length === 0) return '0'
  return filtered
    .map(function (property) {
      let value = this[property] || 0

      // Account for fractional part of seconds,
      // remove trailing zeroes.
      if (property === 'seconds' && this.milliseconds) {
        value = (value + this.milliseconds / 1000).toFixed(6).replace(/\.?0+$/, '')
      }

      // fractional seconds will be a String, all others are Number
      const isSingular = String(value) === '1'
      // Remove plural 's' when the value is singular
      return value + ' ' + (isSingular ? property.replace(/s$/, '') : property)
    }, this)
    .join(' ')
}

const propertiesISOEquivalent = {
  years: 'Y',
  months: 'M',
  days: 'D',
  hours: 'H',
  minutes: 'M',
  seconds: 'S'
}
const dateProperties = ['years', 'months', 'days']
const timeProperties = ['hours', 'minutes', 'seconds']
// according to ISO 8601
PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function () {
  return toISOString.call(this, { short: false })
}

PostgresInterval.prototype.toISOStringShort = function () {
  return toISOString.call(this, { short: true })
}

function toISOString ({ short = false }) {
  const datePart = dateProperties
    .map(buildProperty, this)
    .join('')

  const timePart = timeProperties
    .map(buildProperty, this)
    .join('')

  if (!timePart.length && !datePart.length) return 'PT0S'

  if (!timePart.length) return `P${datePart}`

  return `P${datePart}T${timePart}`

  function buildProperty (property) {
    let value = this[property] || 0

    // Account for fractional part of seconds,
    // remove trailing zeroes.
    if (property === 'seconds' && this.milliseconds) {
      value = (value + this.milliseconds / 1000).toFixed(6).replace(/0+$/, '')
    }

    if (short && !value) return ''

    return value + propertiesISOEquivalent[property]
  }
}

const NUMBER = '([+-]?\\d+)'
const YEAR = `${NUMBER}\\s+years?`
const MONTH = `${NUMBER}\\s+mons?`
const DAY = `${NUMBER}\\s+days?`

const HOUR = `([+-])?${NUMBER}\\s+hours?`
const MINUTE = `([+-])?${NUMBER}\\s+minutes?`
const SECOND = `([+-])?${NUMBER}\\s+seconds?`

// NOTE: PostgreSQL automatically overflows seconds into minutes and minutes
// into hours, so we can rely on minutes and seconds always being 2 digits
// (plus decimal for seconds). The overflow stops at hours - hours do not
// overflow into days, so could be arbitrarily long.
const TIME = '([+-])?(\\d+):(\\d\\d):(\\d\\d(?:\\.\\d{1,6})?)'
const INTERVAL = new RegExp(
  '^\\s*' +
    // All parts of an interval are optional
    [YEAR, MONTH, DAY, TIME].map((str) => '(?:' + str + ')?').join('\\s*') +
    '\\s*$'
)

const INTERVAL_VERBOSE = new RegExp(
  '^\\s*' +
  // All parts of an interval are optional
  [YEAR, MONTH, DAY, HOUR, MINUTE, SECOND].map((str) => '(?:' + str + ')?').join('\\s*') +
  '\\s*$'
)

// All intervals will have exactly these properties:
const ZERO_INTERVAL = Object.freeze({
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0.0
})

function parse (interval) {
  if (!interval) {
    return ZERO_INTERVAL
  }

  let matches = INTERVAL.exec(interval) || []
  let yearsString,
    monthsString,
    daysString,
    plusMinusTime,
    hoursString,
    minutesString,
    secondsString,
    plusMinusHours,
    plusMinusMinutes,
    plusMinusSeconds

  plusMinusTime = plusMinusHours = plusMinusMinutes = plusMinusSeconds = 1

  if (matches.length === 0 && INTERVAL_VERBOSE.test(interval)) {
    matches = INTERVAL_VERBOSE.exec(interval) || []
    const [
      ,
      _yearsString,
      _monthsString,
      _daysString,
      _plusMinusHours,
      _hoursString,
      _plusMinusMinutes,
      _minutesString,
      _plusMinusSeconds,
      _secondsString
    ] = matches

    yearsString = _yearsString
    monthsString = _monthsString
    daysString = _daysString
    hoursString = _hoursString
    minutesString = _minutesString
    secondsString = _secondsString
    plusMinusHours = _plusMinusHours === '-' ? -1 : 1
    plusMinusMinutes = _plusMinusMinutes === '-' ? -1 : 1
    plusMinusSeconds = _plusMinusSeconds === '-' ? -1 : 1
  } else {
    const [
      ,
      _yearsString,
      _monthsString,
      _daysString,
      _plusMinusTime,
      _hoursString,
      _minutesString,
      _secondsString
    ] = matches

    yearsString = _yearsString
    monthsString = _monthsString
    daysString = _daysString
    hoursString = _hoursString
    minutesString = _minutesString
    secondsString = _secondsString
    plusMinusTime = _plusMinusTime === '-' ? -1 : 1
  }

  const years = yearsString ? parseInt(yearsString, 10) : 0
  const months = monthsString ? parseInt(monthsString, 10) : 0
  const days = daysString ? parseInt(daysString, 10) : 0
  const hours = hoursString ? plusMinusTime * plusMinusHours * parseInt(hoursString, 10) : 0
  const minutes = minutesString
    ? plusMinusTime * plusMinusMinutes * parseInt(minutesString, 10)
    : 0
  const secondsFloat = parseFloat(secondsString) || 0
  // secondsFloat is guaranteed to be >= 0, so floor is safe
  const absSeconds = Math.floor(secondsFloat)
  const seconds = plusMinusTime * plusMinusSeconds * absSeconds
  // Without the rounding, we end up with decimals like 455.99999999999994 instead of 456
  const milliseconds = Math.round(plusMinusTime * plusMinusSeconds * (secondsFloat - absSeconds) * 1000000) / 1000
  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    milliseconds
  }
}
PostgresInterval.parse = parse
