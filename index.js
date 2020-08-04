'use strict'

module.exports = PostgresInterval

function PostgresInterval (raw) {
  if (!(this instanceof PostgresInterval)) {
    return new PostgresInterval(raw)
  }

  for (const key in positions) {
    this[key] = 0
  }

  Object.assign(this, parse(raw))
}
const properties = ['seconds', 'minutes', 'hours', 'days', 'months', 'years']
PostgresInterval.prototype.toPostgres = function () {
  const filtered = properties.filter(key => Object.prototype.hasOwnProperty.call(this, key) && this[key] !== 0)

  // In addition to `properties`, we need to account for fractions of seconds.
  if (this.milliseconds && filtered.indexOf('seconds') < 0) {
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

      return value + ' ' + property
    }, this)
    .join(' ')
}

const defaultOptions = { short: false }
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
PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function (options = {}) {
  const { short } = { ...defaultOptions, ...options }

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
const YEAR = NUMBER + '\\s+years?'
const MONTH = NUMBER + '\\s+mons?'
const DAY = NUMBER + '\\s+days?'
const TIME = '([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?'
const INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function (regexString) {
  return '(' + regexString + ')?'
})
  .join('\\s*'))

// Positions of values in regex match
const positions = {
  years: 2,
  months: 4,
  days: 6,
  hours: 9,
  minutes: 10,
  seconds: 11,
  milliseconds: 12
}
// We can use negative time
const negatives = ['hours', 'minutes', 'seconds', 'milliseconds']

function parseMilliseconds (fraction) {
  // add omitted zeroes
  const microseconds = fraction + '000000'.slice(fraction.length)
  return parseInt(microseconds, 10) / 1000
}

function parse (interval) {
  if (!interval) return {}
  const matches = INTERVAL.exec(interval)
  const isNegative = matches[8] === '-'
  return Object.keys(positions)
    .reduce(function (parsed, property) {
      const position = positions[property]
      let value = matches[position]
      // no empty string
      if (!value) return parsed
      // milliseconds are actually microseconds (up to 6 digits)
      // with omitted trailing zeroes.
      value = property === 'milliseconds'
        ? parseMilliseconds(value)
        : parseInt(value, 10)
      // no zeros
      if (!value) return parsed
      if (isNegative && ~negatives.indexOf(property)) {
        value *= -1
      }
      parsed[property] = value
      return parsed
    }, {})
}
