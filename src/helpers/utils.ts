import fetch from 'node-fetch';
import {exit} from 'process';
import {FIVE_MINUTES} from './constants';
import {VersionManifest, VersionType} from '../types';
import {JSDOM} from 'jsdom';

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
    console.error(`Error fetching ${url}.`);
    exit(1);
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
      exit(1);
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
  text = text.replace(/\u2019/g, "'");
  text = text.replace(/\u201d|\u201c/g, '"');
  text = text.replace('\n', ' ');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}
