'use strict'

var xtend = require('xtend/mutable')

/**
 * Key is what Postgres uses,
 * value is what we place into PostgresInterval instance.
 * @type {Object}
 */
var labels = {
  'year': 'years',
  'years': 'years',
  'mon': 'months',
  'mons': 'months',
  'day': 'days',
  'days': 'days',
  'hour': 'hours',
  'hours ': 'hours',
  'min': 'minutes',
  'mins ': 'minutes',
  'sec': 'seconds',
  'secs': 'seconds'
}

/**
 * Awkward version of saying `Object.values(labels).unique()`.
 * @type {[String]}
 */
var units = Object.keys(labels)
  .map(function (key) { return labels[key] })
  .filter(function (val, idx, self) { return self.indexOf(val) === idx })

/**
 * Generates defaults props for PostgresInterval instance.
 * @type {Object} Keys are from `units`, values are 0.
 */
var defaults = units.reduce(function (self, label) {
  self[label] = 0
  return self
}, {})

/**
 * Returns object for extending PostgresInterval with,
 * parses portion of the @string that contains `amount unit`.
 * @param  {String} string Database output.
 * @return {Object}
 */
var captureUnits = function (string) {
  var re = /([+-]?\d+ (?:years?|days?|mons?))/g
  var matches = string.match(re)
  var units = {}

  if (matches) {
    matches.forEach(function (unit) {
      var parts = unit.split(' ')
      var value = parts[0]
      var label = parts[1]

      units[labels[label]] = parseFloat(value)
    })
  }

  return units
}

/**
 * Returns object for extending PostgresInterval with,
 * parses time portion of the @string.
 * @param  {String} string Database output.
 * @return {Object}
 */
var captureTime = function (string) {
  var re = /((?:[+-]?\d+):(?:\d{2}):(?:\d{2})(?:\.\d{1,6})?)/
  var matches = re.exec(string)
  var time = {}

  if (matches) {
    var isNegative = matches[0][0] === '-'
    var parts = matches[1].split(':').map(parseFloat)
    var hours = parts[0]
    var minutes = parts[1]
    var seconds = parts[2]

    if (isNegative) {
      // Invert non-zero amounts,
      // but do not convert 0 to -0.
      hours = hours > 0 ? -hours : hours
      minutes = 0 - minutes
      seconds = 0 - seconds
    }

    time = {
      hours: hours,
      minutes: minutes,
      seconds: seconds
    }
  }

  return time
}

function PostgresInterval (raw) {
  xtend(
    this,
    defaults,
    captureUnits(raw),
    captureTime(raw)
  )
}

PostgresInterval.prototype.toString = function () {
  return this.toPostgres()
}

/**
 * Returns an interval string.
 * This allows the interval object to be passed into prepared statements.
 * @return {String}
 */
PostgresInterval.prototype.toPostgres = function () {
  return units
    .map(function (unit) { return this[unit] + ' ' + unit }, this)
    .join(' ')
}

module.exports = function parseInterval (raw) {
  return new PostgresInterval(raw)
}
