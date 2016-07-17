'use strict';

const labels = {
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
};

const units = Object.keys(labels)
  .map(key => labels[key])
  .filter((val, idx, self) => self.indexOf(val) === idx);

const defaults = units.reduce((self, label) => {
  self[label] = 0;
  return self;
}, {});

// Returns an array of labeled units and their amounts.
const captureUnits = (string) => {
  const re = /([+-]?\d+ (?:years?|days?|mons?))/g;
  const matches = string.match(re);
  const units = {};

  if (matches) {
    matches.forEach(unit => {
      const [value, label] = unit.split(' ');
      units[labels[label]] = parseFloat(value);
    });
  }

  return units;
};

const captureTime = (string) => {
  const re = /((?:[+-]?\d+):(?:\d{2}):(?:\d{2})(?:\.\d{1,6})?)/;
  const matches = re.exec(string);
  let time = {};

  if (matches) {
    let [hours, minutes, seconds] = matches[1].split(':').map(parseFloat);

    if (hours < 0) {
      minutes = -minutes;
      seconds = -seconds;
    }

    time = {hours, minutes, seconds};
  }

  return time;
};

class PostgresInterval {
  constructor (raw) {
    Object.assign(
      this,
      {_raw: raw},
      defaults,
      captureUnits(raw),
      captureTime(raw)
    );
  }

  toString () {
    return units
      .map(unit => `${this[unit]} ${unit}`)
      .join(' ');
  }

  toPostgres () {
    return String(this);
  }
}

module.exports = function parseInterval (raw) {
  return new PostgresInterval(raw);
};
