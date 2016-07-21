'use strict'

var pg = require('pg')
var tape = require('tape')
var async = require('async')
var parse = require('.')

// callback(err, [{
//  input // String   element of `inputs` array
//  pg    // String   how postgres parses it
//  js    // String   how postgres-interval parses it
//  ok    // Boolean  whether pg::interval = js::interval
//                    (from database perspective)
// }])
function selectFromPostgres (callback) {
  var pool = new pg.Pool()
  var query = '' +
    'select ' +
    '  $1::text as input,' +
    '  $1::interval::text as pg,' +
    '  $2::text as js,' +
    '  $1::interval = $2::interval as ok' +
    ';'

  var iterator = function (input, cb) {
    var params = [input, parse(input)]
    pool.query(query, params, function (err, results) {
      cb(err, results ? results.rows[0] : undefined)
    })
  }

  var done = function (err, results) {
    pool.end()
    callback(err, results)
  }

  async.map([
    '04:05:06.123456',
    '1 year',
    '2 days',
    '3 mons',
    '5 years 100 days',
    '1 year 1 mon',
    '2 mons 1 day',
    '3 days 04:05:06.5',
    '-1 year -2 mons +3 days -04:05:06',
    '1 years 1 mon',
    '3 days -1 year -2 mons -04:05:06',
    '01:02:03',
    '100:02:03',
    '1 year -32 days',
    '1 day -00:00:03',
    '00:00:00',
    '00:00:00.5',
    '00:00:00.50',
    '00:00:00.500',
    '00:00:00.5000',
    '00:00:01.100',
    '00:00:00.5',
    '00:00:00.100500',
    '00:00:00.100500',
    '00:00:00.123456'
  ], iterator, done)
}

function test (err, rows) {
  if (err) {
    throw new Error('selectFromPostgres() failed')
  }

  tape('parseInterval()', function (t) {
    rows.forEach(function (row) {
      t.equal(row.ok, true, row.input)
    })

    t.end()
  })
}

if (!module.parent) {
  selectFromPostgres(test)
}
