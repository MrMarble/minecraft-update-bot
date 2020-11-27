import dayjs = require('dayjs');
import duration = require('dayjs/plugin/duration');
dayjs.extend(duration);

export const HOUR = dayjs.duration(1, 'hour').asMilliseconds();
export const TEN_MINUTES = dayjs.duration(10, 'minutes').asMilliseconds();
export const FIVE_MINUTES = dayjs.duration(5, 'minutes').asMilliseconds();

export const versionManifest =
  'https://launchermeta.mojang.com/mc/game/version_manifest.json';

export const MSG_SIZE = 4096;

export const versionFile = `${process.env.NODE_PATH}/latest_version.json`;
