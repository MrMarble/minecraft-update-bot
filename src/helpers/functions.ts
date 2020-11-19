import dayjs = require('dayjs');
import {JSDOM} from 'jsdom';
import {versionManifest} from './constants';
import {Changelog, Feature, Version, VersionManifest} from '../types';
import {doRequest, getChangelogURL, nextUntil, sanitize} from './utils';

export async function getChangelog(url: string): Promise<Changelog> {
  const changelog: Changelog = [];
  const {document} = ((await doRequest(url)) as JSDOM).window;

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
    changelogURL: getChangelogURL(json.versions[0].type, json.versions[0].id),
  };

  return version;
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
