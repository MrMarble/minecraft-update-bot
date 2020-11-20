import fetch from 'node-fetch';
import {FIVE_MINUTES} from './constants';
import {Version, VersionManifest, VersionType} from '../types';
import {JSDOM} from 'jsdom';
import {get, emojify} from 'node-emoji';
import {readFile, writeFile} from 'fs';
import {promisify} from 'util';

/**
 * Makes a GET request
 * @param url url to fetch
 * @param tries maximum number of tries before failure
 */
export async function doRequest(
  url: string,
  tries = 3
): Promise<JSDOM | VersionManifest> {
  if (tries <= 0) {
    console.error(`Error fetching ${url}. No more tries`);
    throw new Error(`Error fetching ${url}. No more tries`);
  }
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Error fetching ${url}. Code: ${response.status}`);
    console.warn(`Retrying in ${FIVE_MINUTES / 1000} seconds.`);
    await sleep(FIVE_MINUTES);
    return doRequest(url, --tries);
  }
  switch (response.headers.get('Content-Type')) {
    case 'application/json':
      return response.json();
    case 'text/html;charset=utf-8':
      return new JSDOM(await response.text(), {
        contentType: 'text/html;charset=utf-8',
      });
    default:
      console.error(
        `Error detecting Content-Type: ${response.headers.get('Content-Type')}`
      );
      throw new Error(
        `Error detecting Content-Type: ${response.headers.get('Content-Type')}`
      );
  }
}

/**
 * Waits for a desired ammount of time
 * @param ms milliseconds to wait
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns the possible url of a minecraft version changelog
 * @param type Type of the release
 * @param id Name of the release
 */
export function getChangelogURL(type: VersionType, id: string): string {
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
