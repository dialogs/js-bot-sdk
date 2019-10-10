/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import Long from 'long';
import { dialog } from '@dlghq/dialog-api';
import { getOpt, dateFromTimestamp } from '../utils';
import UUID from '../UUID';
import Avatar from '../Avatar';
import { GroupType } from './GroupType';

class GroupData {
  public readonly clock: Long;
  public readonly type: GroupType;
  public readonly spaceId: null | UUID;
  public readonly ownerId: number;
  public readonly title: string;
  public readonly avatar: null | Avatar;
  public readonly createdAt: Date;
  public readonly about?: null | string;
  public readonly membersAmount: number;

  public static from(api: dialog.GroupData) {
    return new GroupData(api);
  }

  constructor(api: dialog.GroupData) {
    this.clock = api.clock;
    this.type = GroupType.from(api);
    this.spaceId = api.spaceId ? UUID.from(api.spaceId) : null;
    this.ownerId = api.ownerUserId;
    this.title = api.title;
    this.avatar = api.avatar ? new Avatar(api.avatar) : null;
    this.createdAt = dateFromTimestamp(api.createdAt);
    this.about = getOpt(api.about, null);
    this.membersAmount = api.membersAmount;
  }
}

export default GroupData;
