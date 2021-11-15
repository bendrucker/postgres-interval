'use strict'

const test = require('tape')
const interval = require('./')
const PostgresInterval = require('./')

test(function (t) {
  t.test('parser', function (t) {
    t.equal(Object.assign(interval(), { milliseconds: 1000 }).toPostgres(), '1 second')
    t.deepEqual(interval('01:02:03.456'), Object.assign(new PostgresInterval(), {
      hours: 1,
      minutes: 2,
      seconds: 3,
      milliseconds: 456
    }))
    t.deepEqual(interval('-01:02:03.456'), Object.assign(new PostgresInterval(), {
      hours: -1,
      minutes: -2,
      seconds: -3,
      milliseconds: -456
    }))

    t.equal(interval('00:00:00-5').milliseconds, 0, 'invalid interval format')
    t.equal(interval('00:00:00.5').milliseconds, 500)
    t.equal(interval('00:00:00.50').milliseconds, 500)
    t.equal(interval('00:00:00.500').milliseconds, 500)
    t.equal(interval('00:00:00.5000').milliseconds, 500)
    t.equal(interval('00:00:00.100500').milliseconds, 100.5)

    t.test('zero', function (t) {
      const result = interval('00:00:00')
      t.equal(result.years, 0)
      t.equal(result.months, 0)
      t.equal(result.weeks, 0)
      t.equal(result.days, 0)
      t.equal(result.hours, 0)
      t.equal(result.seconds, 0)
      t.equal(result.milliseconds, 0)

      t.end()
    })

    t.test('empty', function (t) {
      const result = interval('')
      t.equal(result.years, 0)
      t.equal(result.months, 0)
      t.equal(result.weeks, 0)
      t.equal(result.days, 0)
      t.equal(result.hours, 0)
      t.equal(result.seconds, 0)
      t.equal(result.milliseconds, 0)

      t.end()
    })

    t.end()
  })

  t.test('toPostgres', function (t) {
    t.equal(interval('01:02:03').toPostgres(), '1 hour 2 minutes 3 seconds')
    t.equal(interval('100:02:03').toPostgres(), '100 hours 2 minutes 3 seconds')
    t.equal(interval('1 year -32 days').toPostgres(), '1 year -32 days')
    t.equal(interval('1 day -00:00:03').toPostgres(), '1 day -3 seconds')
    t.equal(interval('00:00:00').toPostgres(), '0')
    t.equal(interval('00:00:01.100').toPostgres(), '1.1 seconds')
    t.equal(interval('00:00:00.5').toPostgres(), '0.5 seconds')
    t.equal(interval('00:00:00.100500').toPostgres(), '0.1005 seconds')
    t.equal(interval('00:00:00.123456').toPostgres(), '0.123456 seconds')
    t.equal(interval('-00:00:00.123456').toPostgres(), '-0.123456 seconds')
    t.equal(interval('3 years 1 mon 2 weeks 10 days').toPostgres(), '3 years 1 month 2 weeks 10 days')

    t.end()
  })

  t.test('toISOString', function (t) {
    t.equal(interval('01:02:03').toISOString(), 'P0Y0M0W0DT1H2M3S')
    t.equal(interval('100:02:03').toISOString(), 'P0Y0M0W0DT100H2M3S')
    t.equal(interval('1 year -32 days').toISOString(), 'P1Y0M0W-32DT0H0M0S')
    t.equal(interval('1 day -00:00:03').toISOString(), 'P0Y0M0W1DT0H0M-3S')
    t.equal(interval('00:00:00').toISOString(), 'P0Y0M0W0DT0H0M0S')
    t.equal(interval('00:00:00.0').toISOString(), 'P0Y0M0W0DT0H0M0S')
    t.equal(interval('00:00:01.100').toISOString(), 'P0Y0M0W0DT0H0M1.1S')
    t.equal(interval('00:00:00.5').toISOString(), 'P0Y0M0W0DT0H0M0.5S')
    t.equal(interval('00:00:00.100500').toISOString(), 'P0Y0M0W0DT0H0M0.1005S')
    t.equal(interval('00:00:00.123456').toISOString(), 'P0Y0M0W0DT0H0M0.123456S')
    t.equal(interval('-00:00:00.123456').toISOString(), 'P0Y0M0W0DT0H0M-0.123456S')
    t.equal(interval('3 years 1 mon 2 weeks 10 days').toISOString(), 'P3Y1M2W10DT0H0M0S')
    t.end()
  })

  t.test('toISO', function (t) {
    t.equal(interval('01:02:03').toISOString(), 'P0Y0M0W0DT1H2M3S')
    t.equal(interval('100:02:03').toISOString(), 'P0Y0M0W0DT100H2M3S')
    t.end()
  })

  t.test('toISOStringShort', function (t) {
    t.equal(interval('01:02:03').toISOStringShort(), 'PT1H2M3S')
    t.equal(interval('100:02:03').toISOStringShort(), 'PT100H2M3S')
    t.equal(interval('1 year -32 days').toISOStringShort(), 'P1Y-32D')
    t.equal(interval('1 day -00:00:03').toISOStringShort(), 'P1DT-3S')
    t.equal(interval('00:00:00').toISOStringShort(), 'PT0S')
    t.equal(interval('00:00:00.0').toISOStringShort(), 'PT0S')
    t.equal(interval('00:00:01.100').toISOStringShort(), 'PT1.1S')
    t.equal(interval('00:00:00.5').toISOStringShort(), 'PT0.5S')
    t.equal(interval('00:00:00.100500').toISOStringShort(), 'PT0.1005S')
    t.equal(interval('00:00:00.123456').toISOStringShort(), 'PT0.123456S')
    t.equal(interval('-00:00:00.123456').toISOStringShort(), 'PT-0.123456S')
    t.equal(interval('3 years 1 mon 2 weeks 10 days').toISOStringShort(), 'P3Y1M2W10D')
    t.end()
  })

  t.end()
})
