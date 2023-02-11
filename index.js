'use strict'

module.exports = PostgresInterval

function PostgresInterval (raw) {
  if (!(this instanceof PostgresInterval)) {
    return new PostgresInterval(raw)
  }

  this.years = 0
  this.months = 0
  this.days = 0
  this.hours = 0
  this.minutes = 0
  this.seconds = 0
  this.milliseconds = 0

  parse(this, raw)
}
const properties = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']
PostgresInterval.prototype.toPostgres = function () {
  const filtered = properties.filter(
    (key) => Object.prototype.hasOwnProperty.call(this, key) && this[key] !== 0
  )

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
        value = (value + this.milliseconds / 1000)
          .toFixed(6)
          .replace(/\.?0+$/, '')
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

// according to ISO 8601
PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO =
  function () {
    return toISOString.call(this, { short: false })
  }

PostgresInterval.prototype.toISOStringShort = function () {
  return toISOString.call(this, { short: true })
}

function toISOString ({ short }) {
  let datePart = ''

  if (!short || this.years) {
    datePart += this.years + propertiesISOEquivalent.years
  }

  if (!short || this.months) {
    datePart += this.months + propertiesISOEquivalent.months
  }

  if (!short || this.days) {
    datePart += this.days + propertiesISOEquivalent.days
  }

  let timePart = ''

  if (!short || this.hours) {
    timePart += this.hours + propertiesISOEquivalent.hours
  }

  if (!short || this.minutes) {
    timePart += this.minutes + propertiesISOEquivalent.minutes
  }

  if (!short || (this.seconds || this.milliseconds)) {
    if (this.milliseconds) {
      timePart += (Math.trunc((this.seconds + this.milliseconds / 1000) * 1000000) / 1000000) + propertiesISOEquivalent.seconds
    } else {
      timePart += this.seconds + propertiesISOEquivalent.seconds
    }
  }

  if (!timePart && !datePart) {
    return 'PT0S'
  }

  if (!timePart) {
    return `P${datePart}`
  }

  return `P${datePart}T${timePart}`
}

const position = { value: 0 }

function readNextNum (interval) {
  let val = 0

  while (position.value < interval.length) {
    const char = interval[position.value]

    if (char >= '0' && char <= '9') {
      val = val * 10 + +char
      position.value++
    } else {
      break
    }
  }

  return val
}

function parseMillisecond (interval) {
  const currentValue = readNextNum(interval)

  if (currentValue < 10) {
    return currentValue * 100
  }

  if (currentValue < 100) {
    return currentValue * 10
  }

  if (currentValue < 1000) {
    return currentValue
  }

  if (currentValue < 10000) {
    return currentValue / 10
  }

  if (currentValue < 100000) {
    return currentValue / 100
  }

  if (currentValue < 1000000) {
    return currentValue / 1000
  }

  // slow path
  const remainder = currentValue.toString().length - 3
  return currentValue / Math.pow(10, remainder)
}

function parse (instance, interval) {
  if (!interval) {
    return
  }

  position.value = 0

  let currentValue
  let nextNegative = 1

  while (position.value < interval.length) {
    const char = interval[position.value]

    if (char === '-') {
      nextNegative = -1
      position.value++
      continue
    } else if (char === '+') {
      position.value++
      continue
    } else if (char === ' ') {
      position.value++
      continue
    } else if (char < '0' || char > '9') {
      position.value++
      continue
    } else {
      currentValue = readNextNum(interval)

      if (interval[position.value] === ':') {
        instance.hours = currentValue ? nextNegative * currentValue : 0

        position.value++
        currentValue = readNextNum(interval)
        instance.minutes = currentValue ? nextNegative * currentValue : 0

        position.value++
        currentValue = readNextNum(interval)
        instance.seconds = currentValue ? nextNegative * currentValue : 0

        if (interval[position.value] === '.') {
          position.value++

          currentValue = parseMillisecond(interval)
          instance.milliseconds = currentValue ? nextNegative * currentValue : 0
        }

        return
      }

      // skip space
      position.value++

      const unit = interval[position.value]

      if (unit === 'y') {
        instance.years = currentValue ? nextNegative * currentValue : 0
      } else if (unit === 'm') {
        instance.months = currentValue ? nextNegative * currentValue : 0
      } else if (unit === 'd') {
        instance.days = currentValue ? nextNegative * currentValue : 0
      }

      nextNegative = 1
    }
  }
}

PostgresInterval.parse = function (interval) {
  const instance = {
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0
  }

  parse(instance, interval)

  return instance
}
