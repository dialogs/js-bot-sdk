/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Long from 'long';
import { dialog } from '@dlghq/dialog-api';

class GroupOutPeer {
  public readonly id: number;
  public readonly accessHash: Long;

  public static from(api: dialog.GroupOutPeer) {
    return new GroupOutPeer(api.groupId, api.accessHash);
  }

  public static create(id: number, accessHash: Long) {
    return new GroupOutPeer(id, accessHash);
  }

  private constructor(id: number, accessHash: Long) {
    this.id = id;
    this.accessHash = accessHash;
  }

  public toApi(): dialog.GroupOutPeer {
    return dialog.GroupOutPeer.create({
      groupId: this.id,
      accessHash: this.accessHash,
    });
  }

  public toString() {
    return `GroupOutPeer(${this.id})`;
  }
}

export default GroupOutPeer;
