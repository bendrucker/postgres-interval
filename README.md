# postgres-interval

[![Build Status](https://travis-ci.org/bendrucker/postgres-interval.svg?branch=master)](https://travis-ci.org/bendrucker/postgres-interval)
[![Greenkeeper badge](https://badges.greenkeeper.io/bendrucker/postgres-interval.svg)](https://greenkeeper.io/)

Postgres interval parser and converter for Node.js and browser.

## Install

```
$ yarn add postgres-interval
```

or

```
$ npm install --save postgres-interval
```

## Usage

```typescript
import {PostgresInterval} from "postgres-interval";

const interval = PostgresInterval.fromPostgresOutput("01:02:03");

interval.toPostgresOutput();
// "01:02:03"

interval.toPostgresInput();
// "1 hours 2 minutes 3 seconds"

interval.toISO();
// "P0Y0M0DT1H2M3S"

interval.toJSON();
// {hours: 1, minutes: 2, seconds: 3}
```

## API

```typescript

interface Interval {
  readonly years?: number;
  readonly months?: number;
  readonly days?: number;
  readonly hours?: number;
  readonly minutes?: number;
  readonly seconds?: number;
  readonly milliseconds?: number;
}

/**
 * Postgres interval parser and converter
 */
class PostgresInterval implements Interval {
  /**
   * Create instance from string in postgres output format
   * @param value String in postgres output format
   */
  static fromPostgresOutput(value?: string): PostgresInterval;

  /**
   * Create instance from object
   * @param value Object
   */
  static fromObject(value?: Interval): PostgresInterval;

  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;

  /**
   * Convert to string in postgres output format
   */
  toPostgresOutput(): string;

  /**
   * Convert to string in postgres input format
   */
  toPostgresInput(): string;

  /**
   * Convert to string in ISO 8601 format with designators
   */
  toISO(): string;

  toJSON(): Interval;
}
```

## License

MIT © [Ben Drucker](http://bendrucker.me)
