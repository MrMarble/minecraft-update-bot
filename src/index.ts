import {HOUR, TEN_MINUTES} from './helpers/constants';
import {Version} from './types';
import {config} from 'dotenv';
import {emojify} from 'node-emoji';
import {
  formatChangelog,
  getChangelog,
  getLatestVersion,
} from './helpers/functions';
import {
  getChangelogURL,
  readVersionFromFile,
  sendMessage,
  sleep,
  writeVersionToFile,
} from './helpers/utils';

config();

let latestVersion: Version;
const versionPath = `${process.env.NODE_PATH}/latest_version.json`;

async function main() {
  latestVersion = (await readVersionFromFile(versionPath)) as Version;

  checkVersion();
}

async function checkVersion() {
  console.log('Checking latest version...');
  const currVersion = await getLatestVersion();

  if (currVersion?.id !== latestVersion?.id) {
    console.log(`New version available! ${currVersion.id}`);
    latestVersion = currVersion;
    writeVersionToFile(latestVersion, versionPath);
    const changelogUrl = getChangelogURL(latestVersion.type, latestVersion.id);
    try {
      console.log('Getting changelog...');
      const changelog = await getChangelog(changelogUrl);
      const formatedLog = formatChangelog(changelog);
      sendMessage(
        `<a href="${changelogUrl}">${emojify(
          ':earth_africa:'
        ).trim()}</a>${formatedLog.trim()}`
      );
    } catch (error) {
      console.error(error);
      console.log(
        `Seems like ${changelogUrl} is not ready yet. Waiting ${
          TEN_MINUTES / 1000
        } seconds`
      );
      sendMessage(
        [
          'New Minecraft version available! waiting for the changelog...',
          `\n<pre>${currVersion.type} - ${currVersion.id}</pre>`,
        ].join('\n')
      );
      await sleep(TEN_MINUTES);
      checkVersion();
    }
  }
  console.log(`Done! waiting ${HOUR / 1000} seconds`);
  setTimeout(checkVersion, HOUR);
}

console.info('Starting Minecraft bot...');

main();
