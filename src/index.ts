import {HOUR} from './helpers/constants';
import {Version} from './types';
import {getLatestVersion} from './helpers/functions';

export const versionManifest =
  'https://launchermeta.mojang.com/mc/game/version_manifest.json';

let latestVersion: Version;

async function checkVersion() {
  const currVersion = await getLatestVersion();

  if (currVersion.id !== latestVersion.id) {
    latestVersion = currVersion;
  }

  setTimeout(checkVersion, HOUR);
}

async () => {
  latestVersion = await getLatestVersion();
  setTimeout(checkVersion, HOUR);
};
