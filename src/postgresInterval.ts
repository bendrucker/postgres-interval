import {Interval} from "./interval";
import postgresOutputRegExp from "./postgresOutputRegExp";

/**
 * Postgres interval parser and converter
 */
export class PostgresInterval implements Interval {
  /**
   * Create instance from string in postgres output format
   * @param value String in postgres output format
   */
  public static fromPostgresOutput(value?: string): PostgresInterval {
    const interval = new PostgresInterval();

    if (!value) {
      return interval;
    }

    const matches = postgresOutputRegExp.exec(value) as RegExpExecArray;

    const isNegative = matches[8] === "-" ? -1 : 1;

    interval.years = parseInt(matches[2] || "0", 10);
    interval.months = parseInt(matches[4] || "0", 10);
    interval.days = parseInt(matches[6] || "0", 10);
    interval.hours = parseInt(matches[9] || "0", 10) * isNegative;
    interval.minutes = parseInt(matches[10] || "0", 10) * isNegative;
    interval.seconds = parseInt(matches[11] || "0", 10) * isNegative;
    interval.milliseconds = parseInt((matches[12] || "0").padEnd(6, "0"), 10) / 1000 * isNegative;

    return interval;
  }

  /**
   * Create instance from object
   * @param value Object
   */
  public static fromObject(value?: Interval): PostgresInterval {
    const interval = new PostgresInterval();

    if (!value) {
      return interval;
    }

    interval.years = value.years || 0;
    interval.months = value.months || 0;
    interval.days = value.days || 0;
    interval.hours = value.hours || 0;
    interval.minutes = value.minutes || 0;
    interval.seconds = value.seconds || 0;
    interval.milliseconds = value.milliseconds || 0;

    return interval;
  }

  private _years: number = 0;
  private _months: number = 0;
  private _days: number = 0;
  private _hours: number = 0;
  private _minutes: number = 0;
  private _seconds: number = 0;
  private _milliseconds: number = 0;

  public get years(): number {
    return this._years;
  }

  public set years(value: number) {
    this._years = value;
  }

  public get months(): number {
    return this._months;
  }

  public set months(value: number) {
    this._months = value;
  }

  public get days(): number {
    return this._days;
  }

  public set days(value: number) {
    this._days = value;
  }

  public get hours(): number {
    return this._hours;
  }

  public set hours(value: number) {
    this._hours = value;
  }

  public get minutes(): number {
    return this._minutes;
  }

  public set minutes(value: number) {
    this.hours += Math.trunc(value / 60);
    this._minutes = value % 60;
  }

  public get seconds(): number {
    return this._seconds;
  }

  public set seconds(value: number) {
    this.minutes += Math.trunc(value / 60);
    this._seconds = value % 60;
  }

  public get milliseconds(): number {
    return this._milliseconds;
  }

  public set milliseconds(value: number) {
    this.seconds += Math.trunc(value / 1000);
    this._milliseconds = value % 1000;
  }

  protected get microseconds(): number {
    return (this.milliseconds * 1000);
  }

  protected get secondsWithMicroseconds(): string {
    return (this.seconds + this.milliseconds / 1000).toFixed(6).replace(/\.?0+$/, "");
  }

  /**
   * Convert to string in postgres output format
   */
  public toPostgresOutput(): string {
    return [
      [
        this.years ? `${this.years} years` : null,
        this.months ? `${this.months} mons` : null,
        this.days ? `${this.days} days` : null,
      ].filter((x) => x).join(" "),
      [
        [
          [this.hours, this.minutes, this.seconds, this.milliseconds].some((x) => x < 0) ? "-" : "",
          String(Math.abs(this.hours)).padStart(2, "0"),
        ].filter((x) => x).join(""),
        String(Math.abs(this.minutes)).padStart(2, "0"),
        [
          String(Math.abs(this.seconds)).padStart(2, "0"),
          String(Math.abs(this.microseconds)).replace(/0+$/, ""),
        ].filter((x) => x).join("."),
      ].join(":"),
    ].filter((x) => x).join(" ");
  }

  /**
   * Convert to string in postgres input format
   */
  public toPostgresInput(): string {
    const seconds = this.secondsWithMicroseconds;
    return [
      this.years ? `${this.years} years` : null,
      this.months ? `${this.months} months` : null,
      this.days ? `${this.days} days` : null,
      this.hours ? `${this.hours} hours` : null,
      this.minutes ? `${this.minutes} minutes` : null,
      seconds !== "0" ? `${this.secondsWithMicroseconds} seconds` : null,
    ].filter((x) => x).join(" ") || "0";
  }

  /**
   * Convert to string in ISO 8601 format with designators
   */
  public toISO(): string {
    return [
      "P",
      `${this.years}Y`,
      `${this.months}M`,
      `${this.days}D`,
      "T",
      `${this.hours}H`,
      `${this.minutes}M`,
      `${this.secondsWithMicroseconds}S`,
    ].join("");
  }

  public toJSON(): Interval {
    const interval = {
      years: this.years,
      months: this.months,
      days: this.days,
      hours: this.hours,
      minutes: this.minutes,
      seconds: this.seconds,
      milliseconds: this.milliseconds,
    } as { [key: string]: number };
    Object.entries(interval).map((pair) => !pair[1] && delete interval[pair[0]]);
    return interval;
  }
}
