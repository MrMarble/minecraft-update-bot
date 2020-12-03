import {HOUR, TEN_MINUTES, versionFile} from './constants';
import {Version} from '../types';
import {
  formatChangelog,
  getChangelog,
  getChangelogURL,
  getLatestVersion,
  readVersionFromFile,
  sendMessage,
  writeVersionToFile,
} from './utils';
import {emojify} from 'node-emoji';
import {sleep} from './helpers';

export async function loop() {
  let latestVersion = (await readVersionFromFile(versionFile)) as Version;
  let oscilationTime = 0; // Don't wait on first execution.

  let changelogTries = 3;

  for (;;) {
    await sleep(oscilationTime);

    const currentVersion = await getLatestVersion();

    // If there is no new version do nothing
    if (latestVersion?.id === currentVersion?.id) {
      oscilationTime = HOUR;
      continue;
    }

    console.log(`New Minecraft version ${currentVersion.id} available.`);

    const changeLog = await getChangelog(currentVersion);

    // If changelog is not yet available
    if (changeLog?.length === 0 && changelogTries > 0) {
      console.log(`Changelog for ${currentVersion.id} is not available yet.`);
      oscilationTime = TEN_MINUTES;
      changelogTries--;
      continue;
    }

    // Seems like this version does not have a changelog (yet)
    if (0 === changelogTries) {
      console.log('Someone is taking his time to make the changelog...');
      oscilationTime = HOUR;
      changelogTries = 3;
      continue;
    }

    sendMessage(
      `<a href="${getChangelogURL(currentVersion)}">${emojify(
        ':earth_africa:'
      ).trim()}</a>${formatChangelog(changeLog).trim()}`
    );

    latestVersion = currentVersion;
    writeVersionToFile(latestVersion, versionFile);
    oscilationTime = HOUR;
    console.log('Message sent, restarting loop');
  }
}
