/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Long from 'long';
import { dialog } from '@dlghq/dialog-api';

class UserOutPeer {
  public readonly id: number;
  public readonly accessHash: Long;

  public static from(api: dialog.UserOutPeer) {
    return new UserOutPeer(api.uid, api.accessHash);
  }

  public static create(id: number, accessHash: Long) {
    return new UserOutPeer(id, accessHash);
  }

  private constructor(id: number, accessHash: Long) {
    this.id = id;
    this.accessHash = accessHash;
  }

  public toApi(): dialog.UserOutPeer {
    return dialog.UserOutPeer.create({
      uid: this.id,
      accessHash: this.accessHash,
    });
  }

  public toString() {
    return `UserOutPeer(${this.id})`;
  }
}

export default UserOutPeer;
