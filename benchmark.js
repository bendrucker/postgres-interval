'use strict'

const PostgresInterval = require('./')
const intervalsToParse = []

const MICROSECONDS = [0, 1, 100, 1000, 10000, 999999]
const SECONDS = [0, 1, 5, 10, 20, 59]
const MINUTES = [0, 1, 5, 10, 20, 59]
const MAX_HOURS = 23
const MAX_DAYS = 30
const MAX_MONTHS = 30
const MAX_YEARS = 30

for (let year = 0; year <= MAX_YEARS; year += 6) {
  for (let month = 0; month <= MAX_MONTHS; month += 6) {
    for (let day = 0; day <= MAX_DAYS; day += 6) {
      for (let hour = 0; hour <= MAX_HOURS; hour += 6) {
        for (const minute of MINUTES) {
          for (const second of SECONDS) {
            for (const microsecond of MICROSECONDS) {
              let interval = ''
              if (year > 0) {
                interval += `${year} year${year === 1 ? '' : 's'} `
              }
              if (month > 0) {
                interval += `${month} mon${month === 1 ? '' : 's'} `
              }
              if (day > 0) {
                interval += `${day} day${day === 1 ? '' : 's'} `
              }
              if (
                hour > 0 ||
                minute > 0 ||
                second > 0 ||
                microsecond > 0 ||
                (!year && !month && !day)
              ) {
                const s = second + microsecond * 1e-6
                interval += `${String(hour).padStart(2, '0')}:${String(
                  minute
                ).padStart(2, '0')}:${(s >= 10 ? '' : '0') + s.toFixed(6)}`
              }
              interval = interval.trim()
              intervalsToParse.push(interval)
            }
          }
        }
      }
    }
  }
}

const l = intervalsToParse.length
console.log(`To process: ${l} intervals`)

async function main () {
  // First benchmark the full path
  for (let i = 0; i < 10; i++) {
    global.gc()
    await new Promise((resolve) => {
      process.nextTick(() => {
        const start = process.hrtime()

        for (let i = 0; i < l; i++) {
          new PostgresInterval(intervalsToParse[i]) // eslint-disable-line no-new
        }
        const fin = process.hrtime(start)
        const dur = fin[0] * 1e3 + fin[1] * 1e-6

        console.log(
          `Processing ${l} intervals took ${dur.toFixed(1)}ms (${(
            l / dur
          ).toFixed(1)} intervals/ms)`
        )
        resolve()
      })
    })
  }

  // Now benchmark just the parsing
  for (let i = 0; i < 10; i++) {
    global.gc()
    await new Promise((resolve) => {
      process.nextTick(() => {
        const start = process.hrtime()

        for (let i = 0; i < l; i++) {
          PostgresInterval.parse(intervalsToParse[i])
        }
        const fin = process.hrtime(start)
        const dur = fin[0] * 1e3 + fin[1] * 1e-6

        console.log(
          `Just parsing ${l} intervals took ${dur.toFixed(1)}ms (${(
            l / dur
          ).toFixed(1)} intervals/ms)`
        )
        resolve()
      })
    })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
