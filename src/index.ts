import {HOUR, TEN_MINUTES} from './helpers/constants';
import {Version} from './types';
import {config} from 'dotenv';
import {emojify} from 'node-emoji';
import {
  formatChangelog,
  getChangelog,
  getLatestVersion,
} from './helpers/functions';
import {getChangelogURL, sendMessage, sleep} from './helpers/utils';

config();

let latestVersion: Version;

async function checkVersion() {
  console.log('Checking latest version...');
  const currVersion = await getLatestVersion();

  if (currVersion?.id !== latestVersion?.id) {
    console.log(`New version available! ${currVersion.id}`);
    latestVersion = currVersion;
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
          `\nVersion: <pre>${currVersion.id}</pre>`,
          `Type: <pre>${currVersion.type}</pre>`,
        ].join('\n')
      );
      sleep(TEN_MINUTES);
      checkVersion();
    }
  }
  console.log(`Done! waiting ${HOUR / 1000} seconds`);
  setTimeout(checkVersion, HOUR);
}

console.info('Starting Minecraft bot...');

checkVersion();
