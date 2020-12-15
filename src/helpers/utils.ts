import fetch from 'node-fetch';
import {MSG_SIZE, versionManifest} from './constants';
import {
  Changelog,
  Feature,
  Version,
  VersionManifest,
  VersionType,
} from '../types';
import {JSDOM} from 'jsdom';
import {get, emojify} from 'node-emoji';
import {readFile, statSync, writeFile} from 'fs';
import {promisify} from 'util';
import dayjs = require('dayjs');
import {doRequest} from './helpers';

/**
 * Returns the possible url of a minecraft version changelog
 * @param type Type of the release
 * @param id Name of the release
 */
export function getChangelogURL({type, id}: Version): string {
  const baseURL = 'https://www.minecraft.net/en-us/article/minecraft';
  let _type = type.toString();
  if (type === VersionType.Release) {
    _type = 'java-edition';
  }
  return `${baseURL}-${_type}-${id.replace(/\./g, '-')}`;
}

/**
 * Get all following siblings of each element up to but not including the element matched by the selector
 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
 *
 * @param  {Node}   elem     The element
 * @param  {String} selector The selector to stop at
 * @param  {String} filter   The selector to match siblings against [optional]
 * @return {Array}           The siblings
 */
export function nextUntil(
  elem: Element | null | undefined,
  selector: string,
  filter?: string
): Array<Element> {
  // Setup siblings array
  const siblings = [];

  // Get the next sibling element
  elem = elem?.nextElementSibling;

  // As long as a sibling exists
  while (elem) {
    // If we've reached our match, bail
    if (elem.matches(selector)) break;

    // If filtering by a selector, check if the sibling matches
    if (filter && !elem.matches(filter)) {
      elem = elem.nextElementSibling;
      continue;
    }

    // Otherwise, push it to the siblings array
    siblings.push(elem);

    // Get the next sibling element
    elem = elem.nextElementSibling;
  }

  return siblings;
}

export function sanitize(text: string): string {
  const map: {[key: string]: string} = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '\n': ' ',
    '\u2019': "'",
    '\u201d': '"',
    '\u201c': '"',
  };
  text = text.replace(/[&<>\u2019\u201d\u201c\n]/g, m => {
    return map[m];
  });
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

export function emojize(text: string): string {
  const map: {[key: string]: Array<string>} = {};
  //map[get(':cold_face:')] = ['freezing', 'freeze'];  For some reason this code doesn't work on telegram
  map[get(':snowflake:')] = ['snow'];
  map[get(':mountain:')] = ['cliff', 'mountain'];
  map[get(':goat:')] = ['goat'];
  map[get(':crystal_ball:')] = ['crystal', 'amethyst', 'geode'];
  map[get(':telescope:')] = ['telescope', 'spyglass', 'lens'];
  map[get(':candle:')] = ['candle'];
  map[get(':moneybag:')] = ['bundle'];
  map[get(':squid:')] = ['squid'];
  map[get(':busts_in_silhouette:')] = ['ui', 'ux'];
  map[get(':zap:')] = ['lightning'];
  map[get(':fog:')] = ['textures'];
  map[get(':bug:')] = ['bug'];
  map[get(':gear:')] = ['technical'];
  map[get(':arrows_clockwise:')] = ['change', 'revert'];

  for (const emoji in map) {
    if (Object.prototype.hasOwnProperty.call(map, emoji)) {
      const tokens = map[emoji];
      for (const token of tokens) {
        if (text.toLowerCase().includes(token))
          return emojify(`${emoji} ${text}`);
      }
    }
  }
  return text;
}

export function sendMessage(msg: string) {
  fetch(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      chat_id: process.env.CHAT_ID,
      parse_mode: 'HTML',
      text: msg,
    }),
  }).then(r => r.text().then(t => console.log(t)));
}

export async function readVersionFromFile(
  path: string
): Promise<object | Version> {
  try {
    return JSON.parse((await promisify(readFile)(path)).toString());
  } catch (error) {
    return {};
  }
}

export async function writeVersionToFile(version: Version, path: string) {
  await promisify(writeFile)(path, JSON.stringify(version));
}

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

export function isEmpty(path: string): boolean {
  const stats = statSync(path);
  return stats.size === 0;
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
