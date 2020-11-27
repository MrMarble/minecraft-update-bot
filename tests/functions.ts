import dayjs = require('dayjs');
import {JSDOM} from 'jsdom';
import sinon = require('sinon');
import {suite} from 'uvu';
import * as assert from 'uvu/assert';

import {getChangelog, getLatestVersion} from '../src/helpers/functions';
import * as utils from '../src/helpers/utils';
import {Version, VersionManifest, VersionType, Changelog} from '../src/types';

const getLatestVersionSuite = suite('getLatestVersion');

getLatestVersionSuite.before.each(ctx => {
  ctx.doRequest = sinon.stub(utils, 'doRequest');
});

getLatestVersionSuite.after.each(ctx => {
  ctx.doRequest.restore();
});

getLatestVersionSuite('Should return Version', async ctx => {
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

getLatestVersionSuite.run();

const getChangelogSuite = suite('getChangelog');

getChangelogSuite.before.each(ctx => {
  ctx.doRequest = sinon.stub(utils, 'doRequest');
  ctx.fakeVersion = {
    type: VersionType.Snapshot,
    id: '',
  } as Version;
});

getChangelogSuite.after.each(ctx => {
  ctx.doRequest.restore();
});

getChangelogSuite('Should return ChangeLog', async ctx => {
  ctx.doRequest.returns(
    JSDOM.fromFile(`${__dirname}/fixtures/changelog.html`, {
      contentType: 'text/html;charset=utf-8',
    })
  );

  const expected: Changelog = [
    {
      name: 'New Features in 20w46a',
      content: [
        {
          name: 'Powder Snow',
          content: [
            'Powder Snow is a trap block that causes any entity that walks into it to sink in it',
            'You can pick up and place powder snow with a bucket',
          ],
        },
        {
          name: 'Freezing',
          content: ['Standing in powder snow will slowly freeze an entity'],
        },
      ],
    },
    {
      name: 'Fixed bugs in 20w46a',
      content: [
        'MC-2490 - TNT animation ends at 80 ticks, ignores fuse length changes',
        "MC-53518 - Endermen don't attack endermites spawned using spawn eggs or /summon",
      ],
    },
  ];
  assert.type(getChangelog, 'function');

  const result: Changelog = await getChangelog(ctx.fakeVersion);
  assert.is(result.length, 2);
  assert.equal(result, expected);
  assert.equal(ctx.doRequest.callCount, 1);
});

getChangelogSuite('Should return empty array', async ctx => {
  ctx.doRequest.returns(false);

  const expected = [];
  assert.type(getChangelog, 'function');

  const result: Changelog = await getChangelog(ctx.fakeVersion);
  assert.is(result.length, 0);
  assert.equal(result, expected);
  assert.equal(ctx.doRequest.callCount, 1);
});

getChangelogSuite.run();
