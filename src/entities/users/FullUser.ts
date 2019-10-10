/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Record from 'dataclass';
import { dialog } from '@dlghq/dialog-api';
import { getOpt } from '../utils';

class FullUser extends Record<FullUser> {
  id: number = -1;
  about: string | null = null;
  preferredLanguages: Array<string> = [];
  timeZone: string | null = null;
  isBlocked: boolean = false;
  customProfile: string | null = null;

  static from(api: dialog.FullUser) {
    return new FullUser({
      id: api.id,
      about: getOpt(api.about, null),
      preferredLanguages: api.preferredLanguages,
      timeZone: getOpt(api.timeZone, null),
      isBlocked: getOpt(api.isBlocked, false),
      customProfile: api.customProfile || null,
    });
  }

  public toString() {
    return `FullUser(
      id: ${this.id.toString()},
      about: ${this.about},
      preferredLanguages: ${this.preferredLanguages.toString()},
      timeZone: ${this.timeZone},
      isBlocked: ${this.isBlocked},
      customProfile: ${this.customProfile},
    )`;
  }
}

export default FullUser;
