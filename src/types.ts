import {Dayjs} from 'dayjs';

export enum VersionType {
  Release = 'release',
  Snapshot = 'snapshot',
}

export interface Version {
  type: VersionType;
  id: string;
  changelogURL: string;
  time: Dayjs;
}

export interface Change {
  [key: string]: Array<string>;
}

export interface Feature {
  [key: string]: Array<Change | string>;
}

export type Changelog = Array<Feature>;

export interface VersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: [
    {
      id: string;
      type: VersionType;
      url: string;
      time: string;
      releaseTime: string;
    }
  ];
}
