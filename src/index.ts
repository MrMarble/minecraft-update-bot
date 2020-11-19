import {HOUR, TEN_MINUTES} from './helpers/constants';
import {Version} from './types';
import {config} from 'dotenv';
import fetch from 'node-fetch';
import {
  formatChangelog,
  getChangelog,
  getLatestVersion,
} from './helpers/functions';
import {getChangelogURL} from './helpers/utils';

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
      console.log(
        `Sending changelog to https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`
      );
      const r = await fetch(
        `https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            chat_id: process.env.CHAT_ID,
            parse_mode: 'HTML',
            text: formatedLog,
          }),
        }
      );
      console.log(await r.text());
    } catch (error) {
      console.log(
        `Seems like ${changelogUrl} is not ready yet. Waiting ${
          TEN_MINUTES / 1000
        } seconds`
      );
      console.error(error);
      setTimeout(checkVersion, TEN_MINUTES);
    }
  }

  setTimeout(checkVersion, HOUR);
}

console.info('Starting Minecraft bot...');

checkVersion();
