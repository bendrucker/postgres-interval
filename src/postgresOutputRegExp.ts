const NUMBER = "([+-]?\\d+)";
const YEAR = NUMBER + "\\s+years?";
const MONTH = NUMBER + "\\s+mons?";
const DAY = NUMBER + "\\s+days?";
const TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
const INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map((regexString) => `(${regexString})?`).join("\\s*"));

export default INTERVAL;
