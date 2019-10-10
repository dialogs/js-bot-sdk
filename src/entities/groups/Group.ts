/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Long from 'long';
import { dialog } from '@dlghq/dialog-api';
import GroupData from './GroupData';
import GroupOutPeer from './GroupOutPeer';

class Group {
  public readonly id: number;
  public readonly data: GroupData | null;
  public readonly accessHash: Long;

  public static from(api: dialog.Group) {
    return new Group(
      api.id,
      api.data ? GroupData.from(api.data) : null,
      api.accessHash,
    );
  }

  constructor(id: number, data: GroupData | null, accessHash: Long) {
    this.id = id;
    this.data = data;
    this.accessHash = accessHash;
  }

  public getGroupOutPeer() {
    return GroupOutPeer.create(this.id, this.accessHash);
  }
}

export default Group;
