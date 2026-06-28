# postgres-interval [![tests](https://github.com/bendrucker/postgres-interval/workflows/tests/badge.svg)](https://github.com/bendrucker/postgres-interval/actions?query=workflow%3Atests)

> Parse Postgres interval columns


## Install

```sh
npm install --save postgres-interval
```


## Usage

```js
var parse = require('postgres-interval')
var interval = parse('01:02:03')
// => { hours: 1, minutes: 2, seconds: 3 }
interval.toPostgres()
// 1 hour 2 minutes 3 seconds
interval.toISOString()
// P0Y0M0DT1H2M3S
interval.toISOStringShort()
// PT1H2M3S
```

This package parses the default Postgres interval style. If you have changed [`intervalstyle`](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-INTERVALSTYLE), you will need to set it back to the default:

```sql
set intervalstyle to default;
```

## API

#### `parse(pgInterval)` -> `interval`

##### pgInterval

*Required*  
Type: `string`

A Postgres interval string.

This package is focused on parsing Postgres outputs. It optimizes for performance by assuming that inputs follow the default interval format. It does not perform any validation on the input. If any interval field is not found, its value will be set to `0` in the returned `interval`.

#### `interval.toPostgres()` -> `string`

Returns an interval string. This allows the interval object to be passed into prepared statements.

#### `interval.toISOString()` -> `string`

Returns an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Durations) compliant string, for example `P0Y0M0DT0H9M0S`.

Also available as `interval.toISO()` for backwards compatibility.

#### `interval.toISOStringShort()` -> `string`

Returns an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601#Durations) compliant string shortened to minimum length, for example `PT9M`.

#### `interval.toTemporalDuration()` -> `Temporal.Duration`

Returns a [`Temporal.Duration`](https://tc39.es/proposal-temporal/docs/duration.html) representing the interval.

Requires `globalThis.Temporal`. It ships unflagged in Node 26+. On older runtimes, install a polyfill such as [`@js-temporal/polyfill`](https://www.npmjs.com/package/@js-temporal/polyfill) and assign it to `globalThis.Temporal`. The method throws if `Temporal` is unavailable.

Postgres mixed-sign intervals (e.g. `1 mon -1 days`) throw a `RangeError`. `Temporal.Duration` requires all fields to share a single sign, which these intervals violate.

The `Temporal` types are not yet in the default TypeScript lib. To resolve the return type, your project needs Temporal lib types: the TypeScript lib once available, or the `@js-temporal/polyfill` types. This package adds no type dependency.

## License

MIT © [Ben Drucker](http://bendrucker.me)
