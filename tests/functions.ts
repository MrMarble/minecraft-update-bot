import {HOUR, TEN_MINUTES} from './../src/helpers/constants';
import {Version, VersionType} from './../src/types';
// eslint-disable-next-line node/no-unpublished-import
import {SinonStub, spy, stub} from 'sinon';
import {suite} from 'uvu';
import * as helpers from '../src/helpers/helpers';
import * as utils from '../src/helpers/utils';
import * as assert from 'uvu/assert';
import {loop} from '../src/helpers/functions';

interface vSuitCtx {
  sleep: SinonStub;
  readVersionFromFile: SinonStub;
  getLatestVersion: SinonStub;
  fakeVersion: Version;
  getChangelog: SinonStub;
  console: SinonStub;
}

const vSuit = suite<vSuitCtx>('versionLoop', {} as vSuitCtx);

vSuit.before(ctx => {
  ctx.fakeVersion = {
    changelogURL: '', // No relevant
    id: '20w49a',
    type: VersionType.Snapshot,
  } as Version;
});

vSuit.before.each(ctx => {
  ctx.sleep = stub(helpers, 'sleep');
  ctx.readVersionFromFile = stub(utils, 'readVersionFromFile');
  ctx.getLatestVersion = stub(utils, 'getLatestVersion');
  ctx.getChangelog = stub(utils, 'getChangelog');

  ctx.console = stub(console, 'log');
});

vSuit.after.each(ctx => {
  ctx.sleep.restore();
  ctx.readVersionFromFile.restore();
  ctx.getLatestVersion.restore();
  ctx.getChangelog.restore();

  ctx.console.restore();
});

vSuit('Should be a function', () => {
  assert.type(loop, 'function');
});

vSuit('Should continue if no new version', async ctx => {
  ctx.readVersionFromFile.resolves(ctx.fakeVersion);
  ctx.getLatestVersion.resolves(ctx.fakeVersion);

  let callCount = 2;
  const exitCondition = spy(() => --callCount === 0);

  await loop(exitCondition);

  assert.ok(ctx.sleep.calledTwice);
  assert.ok(exitCondition.calledTwice);
  assert.ok(ctx.sleep.calledWith(HOUR));
  assert.ok(ctx.getLatestVersion.calledOnce);
  assert.ok(ctx.readVersionFromFile.calledOnce);
});

vSuit('Should continue if no changelog', async ctx => {
  ctx.getChangelog.resolves([]);
  ctx.readVersionFromFile.resolves(ctx.fakeVersion);
  ctx.getLatestVersion.resolves({...ctx.fakeVersion, id: '20w50a'});

  let callCount = 2;
  const exitCondition = spy(() => --callCount === 0);

  await loop(exitCondition);

  assert.ok(ctx.sleep.calledTwice);
  assert.ok(ctx.sleep.calledWith(TEN_MINUTES));
  assert.ok(exitCondition.calledTwice);
});

vSuit('Should retry changelog 3 times', async ctx => {
  ctx.getChangelog.resolves([]);
  ctx.readVersionFromFile.resolves(ctx.fakeVersion);
  ctx.getLatestVersion.resolves({...ctx.fakeVersion, id: '20w50a'});

  let callCount = 5;
  const exitCondition = spy(() => --callCount === 0);

  await loop(exitCondition);

  assert.is(ctx.sleep.callCount, 5);
  assert.ok(ctx.sleep.calledWith(HOUR));
  assert.is(exitCondition.callCount, 5);
});

vSuit.run();
