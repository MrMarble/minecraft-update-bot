import dayjs = require('dayjs');
import duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

export const HOUR = dayjs.duration(1, 'hour').asMilliseconds();
export const TEN_MINUTES = dayjs.duration(10, 'minutes').asMilliseconds();
export const FIVE_MINUTES = dayjs.duration(5, 'minutes').asMilliseconds();
