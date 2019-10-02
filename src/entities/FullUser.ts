/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Long from 'long';
import Record from 'dataclass';
import { dialog } from '@dlghq/dialog-api';
import { getOpt } from './utils';
import { google } from '@dlghq/dialog-api/js';

class FullUser extends Record<FullUser> {
  id: number = -1;
  about: string = 'UNKNOWN';
  preferredLanguages: Array<string> = [];
  timeZone: string = 'UNKNOWN';
  isBlocked: boolean = false;
  customProfile: string = 'UNKNOWN';

  static from(api: dialog.FullUser) {
    return new FullUser({
      id: api.id,
      about: api.about ? api.about.value : 'UNKNOWN',
      preferredLanguages: api.preferredLanguages ? api.preferredLanguages : [],
      timeZone: api.timeZone ? api.timeZone.value : 'UNKNOWN',
      isBlocked: api.isBlocked ? api.isBlocked.value : false,
      customProfile: api.customProfile,
    });
  }

  public toString() {
    return `FullUser(\n
      id: ${this.id.toString()},\n
      about: ${this.about},\n
      preferredLanguages: ${this.preferredLanguages.toString()},\n
      timeZone: ${this.timeZone},\n
      isBlocked: ${this.isBlocked},\n
      customProfile: ${this.customProfile},\n
    )`;
  }
}

export default FullUser;
