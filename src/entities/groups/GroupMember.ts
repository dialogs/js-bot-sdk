/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';
import Clock from '../Clock';
import GroupMemberPermission, {
  groupPermissionFromApi,
} from './GroupMemberPermission';
import { dateFromLong, dateFromTimestamp } from '../utils';

class GroupMember {
  public readonly clock: Clock;
  public readonly userId: number;
  public readonly invitedAt: Date;
  public readonly deletedAt: Date | null;
  public readonly permissions: Array<GroupMemberPermission>;

  public static from(api: dialog.Member) {
    return new GroupMember(api);
  }

  constructor(api: dialog.Member) {
    this.clock = Clock.from(api.clock);
    this.userId = api.uid;
    this.invitedAt = dateFromLong(api.invitedAt);
    this.deletedAt = api.deletedAt ? dateFromTimestamp(api.deletedAt) : null;
    this.permissions = api.permissions.map(groupPermissionFromApi);
  }
}

export default GroupMember;
