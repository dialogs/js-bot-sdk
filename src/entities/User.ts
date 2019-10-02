/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Long from 'long';
import Record from 'dataclass';
import { dialog } from '@dlghq/dialog-api';
import { getOpt } from './utils';
import Peer from './Peer';

class User extends Record<User> {
  id: number = -1;
  accessHash: Long = Long.ZERO;
  name: string = 'UNKNOWN';
  isBot: boolean = false;
  nick: null | string = null;

  static from(api: dialog.User) {
    return new User({
      id: api.id,
      accessHash: api.accessHash,
      name: api.data ? api.data.name : 'unknown',
      isBot: api.data ? getOpt(api.data.isBot, false) : false,
      nick: api.data ? getOpt(api.data.nick, null) : null,
    });
  }
}

export default User;
