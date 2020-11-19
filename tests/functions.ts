import dayjs = require('dayjs');
import {readFile} from 'fs';
import {JSDOM} from 'jsdom';
import sinon = require('sinon');
import {promisify} from 'util';
import {suite} from 'uvu';
import * as assert from 'uvu/assert';

import {getChangelog, getLatestVersion} from '../src/helpers/functions';
import * as utils from '../src/helpers/utils';
import {Version, VersionManifest, VersionType, Changelog} from '../src/types';

const funcs = suite('Functions');

funcs.before.each(ctx => {
  ctx.doRequest = sinon.stub(utils, 'doRequest');
});

funcs.after.each(ctx => {
  ctx.doRequest.restore();
});

funcs('getLatestVersion', async ctx => {
  const fakeManifest: VersionManifest = {
    latest: {
      release: '1.16.4',
      snapshot: '20w46a',
    },
    versions: [
      {
        id: '20w46a',
        type: VersionType.Snapshot,
        url:
          'https://launchermeta.mojang.com/v1/packages/00287a31ef6a14866a0b328637e60df6419d69bd/20w46a.json',
        time: '2020-11-11T15:42:34+00:00',
        releaseTime: '2020-11-11T15:30:32+00:00',
      },
    ],
  };

  ctx.doRequest.returns(Promise.resolve(fakeManifest));

  const expected: Version = {
    type: VersionType.Snapshot,
    id: '20w46a',
    time: dayjs('2020-11-11T15:30:32+00:00'),
    changelogURL:
      'https://www.minecraft.net/en-us/article/minecraft-snapshot-20w46a',
  };

  assert.type(getLatestVersion, 'function');
  const result = await getLatestVersion();
  assert.equal(ctx.doRequest.callCount, 1);
  assert.equal(result, expected);
});

funcs('getChangelog', async ctx => {
  ctx.doRequest.returns(
    Promise.resolve(
      new JSDOM(
        await promisify(readFile)(`${__dirname}/fixtures/changelog.html`)
      )
    )
  );

  assert.type(getChangelog, 'function');
  const result: Changelog = await getChangelog('');
  assert.equal(result.length, 6);
  assert.equal(ctx.doRequest.callCount, 1);
});

funcs.run();
