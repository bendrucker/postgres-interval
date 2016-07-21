'use strict'

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

var units = Object.keys(labels)
  .map(key => labels[key])
  .filter((val, idx, self) => self.indexOf(val) === idx)

var defaults = units.reduce((self, label) => {
  self[label] = 0
  return self
}, {})

// Returns an array of labeled units and their amounts.
var captureUnits = (string) => {
  var re = /([+-]?\d+ (?:years?|days?|mons?))/g
  var matches = string.match(re)
  var units = {}

  if (matches) {
    matches.forEach(unit => {
      var [value, label] = unit.split(' ')
      units[labels[label]] = parseFloat(value)
    })
  }

  return units
}

var captureTime = (string) => {
  var re = /((?:[+-]?\d+):(?:\d{2}):(?:\d{2})(?:\.\d{1,6})?)/
  var matches = re.exec(string)
  var time = {}

  if (matches) {
    var [hours, minutes, seconds] = matches[1].split(':').map(parseFloat)

    if (hours < 0) {
      minutes = -minutes
      seconds = -seconds
    }

    time = {hours, minutes, seconds}
  }

  return time
}

function PostgresInterval (raw) {
  Object.assign(
    this,
    {_raw: raw},
    defaults,
    captureUnits(raw),
    captureTime(raw)
  )
}

PostgresInterval.prototype.toString = function () {
  return this.toPostgres()
}

PostgresInterval.prototype.toPostgres = function () {
  return units
    .map(function (unit) { return this[unit] + ' ' + unit }, this)
    .join(' ')
}

module.exports = function parseInterval (raw) {
  return new PostgresInterval(raw)
}
