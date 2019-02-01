import {expect} from "chai";
import "mocha";

import {Interval, PostgresInterval} from "../src";

describe("PostgresInterval", () => {
  describe("fromPostgresOutput", () => {
    [
      ["", {}],
      ["aaa", {}],
      ["00:00:00-5", {}],
      ["01:02:03.456", {
        hours: 1,
        minutes: 2,
        seconds: 3,
        milliseconds: 456,
      }],
      ["-01:02:03.456", {
        hours: -1,
        minutes: -2,
        seconds: -3,
        milliseconds: -456,
      }],
      ["00:00:00.5", {
        milliseconds: 500,
      }],
      ["00:00:00.50", {
        milliseconds: 500,
      }],
      ["00:00:00.500", {
        milliseconds: 500,
      }],
      ["00:00:00.5000", {
        milliseconds: 500,
      }],
      ["00:00:00.100500", {
        milliseconds: 100.5,
      }],
    ].map((item) => {
      it(item[0] as string, () => {
        expect(PostgresInterval.fromPostgresOutput(item[0] as string).toJSON()).deep.equal(item[1]);
      });
    });
  });

  describe("fromObject -> toPostgresOutput", () => {
    [
      [null, "00:00:00"],
      [{
        milliseconds: 100.5,
      }, "00:00:00.1005"],
      [{
        milliseconds: 500,
      }, "00:00:00.5"],
      [{
        milliseconds: -500,
      }, "-00:00:00.5"],
      [{
        milliseconds: 1000,
      }, "00:00:01"],
      [{
        seconds: 70,
      }, "00:01:10"],
      [{
        seconds: -70,
      }, "-00:01:10"],
      [{
        minutes: 70,
        seconds: 70,
        milliseconds: 1500,
      }, "01:11:11.5"],
      [{
        minutes: -70,
        seconds: -70,
        milliseconds: -1500,
      }, "-01:11:11.5"],
      [{
        hours: 25,
        minutes: 70,
        seconds: 70,
        milliseconds: 1500,
      }, "26:11:11.5"],
      [{
        hours: -25,
        minutes: -70,
        seconds: -70,
        milliseconds: -1500,
      }, "-26:11:11.5"],
      [{
        years: 4,
        months: 3,
        days: 2,
        hours: 25,
        minutes: 70,
        seconds: 70,
        milliseconds: 1500,
      }, "4 years 3 mons 2 days 26:11:11.5"],
    ].map((item) => {
      it(item[1] as string, () => {
        expect(PostgresInterval.fromObject(item[0] as Interval).toPostgresOutput()).equal(item[1]);
      });
    });
  });

  describe("fromPostgresOutput -> toPostgresInput", () => {
    [
      ["01:02:03", "1 hours 2 minutes 3 seconds"],
      ["100:02:03", "100 hours 2 minutes 3 seconds"],
      ["1 year -32 days", "1 years -32 days"],
      ["1 day -00:00:03", "1 days -3 seconds"],
      ["2 mons 1 day -00:00:03", "2 months 1 days -3 seconds"],
      ["00:00:00", "0"],
      ["00:00:01.100", "1.1 seconds"],
      ["00:00:00.5", "0.5 seconds"],
      ["00:00:00.100500", "0.1005 seconds"],
      ["00:00:00.123456", "0.123456 seconds"],
      ["-00:00:00.123456", "-0.123456 seconds"],
    ].map((item) => {
      it(item[0], () => {
        expect(PostgresInterval.fromPostgresOutput(item[0]).toPostgresInput()).equal(item[1]);
      });
    });
  });

  describe("fromPostgresOutput -> toISO", () => {
    [
      ["01:02:03", "P0Y0M0DT1H2M3S"],
      ["100:02:03", "P0Y0M0DT100H2M3S"],
      ["1 year -32 days", "P1Y0M-32DT0H0M0S"],
      ["1 day -00:00:03", "P0Y0M1DT0H0M-3S"],
      ["00:00:00", "P0Y0M0DT0H0M0S"],
      ["00:00:01.100", "P0Y0M0DT0H0M1.1S"],
      ["00:00:00.5", "P0Y0M0DT0H0M0.5S"],
      ["00:00:00.100500", "P0Y0M0DT0H0M0.1005S"],
      ["00:00:00.123456", "P0Y0M0DT0H0M0.123456S"],
      ["-00:00:00.123456", "P0Y0M0DT0H0M-0.123456S"],
    ].map((item) => {
      it(item[0], () => {
        expect(PostgresInterval.fromPostgresOutput(item[0]).toISO()).equal(item[1]);
      });
    });
  });
});
