'use strict'

var test = require('tape')
var interval = require('./')

test(function (t) {
  t.deepEqual(interval('01:02:03.456'), {
    hours: 1,
    minutes: 2,
    seconds: 3,
    milliseconds: 456
  })
  t.equal(interval('01:02:03').toPostgres(), '3 seconds 2 minutes 1 hours')
  t.equal(interval('100:02:03').toPostgres(), '3 seconds 2 minutes 100 hours')
  t.equal(interval('1 year -32 days').toPostgres(), '-32 days 1 years')
  t.equal(interval('1 day -00:00:03').toPostgres(), '-3 seconds 1 days')
  t.equal(interval('00:00:00').toPostgres(), '0')
  t.equal(interval('00:00:00.5').milliseconds, 500)
  t.equal(interval('00:00:00.50').milliseconds, 500)
  t.equal(interval('00:00:00.500').milliseconds, 500)
  t.equal(interval('00:00:00.5000').milliseconds, 500)
  t.end()
})
