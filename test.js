'use strict';

const pg = require('pg');
const expect = require('expect.js');
const parse = require('.');

describe('PostgresInterval', () => {
  const pool = new pg.Pool();

  const check = (input, cb) => {
    const query = `
      select
        $1::interval::text as pg,
        $2::text as js,
        $1::interval = $2::interval as ok
      ;
    `;

    const params = [input || 0, parse(input)];

    it(input, (done) => {
      pool.query(query, params, (err, result) => {
        expect(err).to.be(null);
        expect(result.rows[0].ok).to.be(true);

        if (process.env.hasOwnProperty('DEBUG'))
          console.log(result.rows);

        done();
      });
    });
  };

  ` 04:05:06.123456
    1 year
    2 days
    3 mons
    5 years 100 days
    1 year 1 mon
    2 mons 1 day
    3 days 04:05:06.5
    -1 year -2 mons +3 days -04:05:06
    1 years 1 mon
    3 days -1 year -2 mons -04:05:06
  `.split('\n').slice(0, -1).map(s => s.trim()).forEach(check);
});
