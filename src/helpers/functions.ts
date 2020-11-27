import dayjs = require('dayjs');
import {JSDOM} from 'jsdom';
import {
  HOUR,
  MSG_SIZE,
  TEN_MINUTES,
  versionFile,
  versionManifest,
} from './constants';
import {Changelog, Feature, Version, VersionManifest} from '../types';
import {
  doRequest,
  emojize,
  getChangelogURL,
  nextUntil,
  readVersionFromFile,
  sanitize,
  sendMessage,
  sleep,
  writeVersionToFile,
} from './utils';
import {emojify} from 'node-emoji';

export async function getChangelog({id, type}: Version): Promise<Changelog> {
  const changelog: Changelog = [];

  const dom = (await doRequest(getChangelogURL({type, id} as Version))) as
    | JSDOM
    | false;
  if (dom === false) {
    return changelog;
  }

  const {document} = dom.window;

  const features = document.querySelectorAll('.article-paragraph h1');

  features.forEach(element => {
    if (element.textContent) {
      const headers = nextUntil(element, 'h1', 'h2,h3');
      let changes: Array<Feature | string> = [];
      if (headers.length > 0) {
        changes = headers
          .map(e => {
            const elements = getListElements(e);
            if (elements !== false && e.textContent) {
              return {name: sanitize(e.textContent), content: elements};
            }
            return undefined;
          })
          .filter(e => e !== undefined) as Array<Feature>;
      } else {
        const elements = getListElements(element);
        if (elements !== false && sanitize(element.textContent)) {
          changes = elements;
        }
      }
      changelog.push({name: sanitize(element.textContent), content: changes});
    }
  });
  return changelog;
}

export async function getLatestVersion(): Promise<Version> {
  const json = (await doRequest(versionManifest)) as VersionManifest;
  const version: Version = {
    type: json.versions[0].type,
    id: json.versions[0].id,
    time: dayjs(json.versions[0].releaseTime),
    changelogURL: getChangelogURL({
      type: json.versions[0].type,
      id: json.versions[0].id,
    } as Version),
  };

  return version;
}

export function formatChangelog(cl: Changelog, max?: number): string {
  const msg: Array<string> = [];
  for (const feature of cl) {
    if (feature.name.startsWith('Get the')) continue;
    msg.push(...formatFeature(feature, max));
  }

  if (msg.join('\n').length > MSG_SIZE) {
    if (max === undefined) max = 4;
    return formatChangelog(cl, --max);
  }
  return msg.join('\n');
}

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

function formatFeature(feat: Feature, max?: number): Array<string> {
  const msg: Array<string> = [];
  msg.push(''); // Empty line
  msg.push(emojize(feat.name.bold()));
  for (const change of feat.content) {
    if (max && feat.content.indexOf(change) >= max) {
      feat.content.indexOf(change) === max && msg.push('... and more!');
      continue;
    }
    if (typeof change === 'string') {
      msg.push(`- ${change}`);
      continue;
    }
    msg.push(...formatFeature(change, max));
  }
  return msg;
}

function getListElements(preceding: Element): Array<string> | false {
  const elements = nextUntil(preceding, 'h2,h3,h1', 'ul');
  if (elements.length === 0) {
    return false;
  }
  const items = elements[0].querySelectorAll('li');
  const data: Array<string> = [];
  items.forEach(el => el.textContent && data.push(sanitize(el.textContent)));
  return data;
}
