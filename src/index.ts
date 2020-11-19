import {HOUR} from './helpers/constants';
import {Version} from './types';
import {getChangelog, getLatestVersion} from './helpers/functions';
import {getChangelogURL} from './helpers/utils';

let latestVersion: Version;

async function checkVersion() {
  const currVersion = await getLatestVersion();

  if (currVersion?.id !== latestVersion?.id) {
    latestVersion = currVersion;
    const changelogUrl = getChangelogURL(latestVersion.type, latestVersion.id);
    const changelog = await getChangelog(changelogUrl);
    console.log(changelog);
  }

  setTimeout(checkVersion, HOUR);
}

checkVersion();
