const fetch = require('node-fetch');
import {JSDOM} from 'jsdom';
import {VersionManifest} from '../types';
import {FIVE_MINUTES} from './constants';

/**
 * Makes a GET request
 * @param url url to fetch
 * @param tries maximum number of tries before failure
 */
export async function doRequest(
  url: string,
  tries = 3
): Promise<JSDOM | VersionManifest | false> {
  if (tries <= 0) {
    console.error(`Error fetching ${url}. No more tries`);
    return false;
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
      return false;
  }
}

/**
 * Waits for a desired ammount of time
 * @param ms milliseconds to wait
 */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
