/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';
import GroupMember from './GroupMember';

class GroupMemberList {
  public readonly items: Array<GroupMember> = [];
  public readonly isLoaded: boolean = false;

  public static from(api: dialog.Group) {
    return new GroupMemberList(
      api.selfMember ? [GroupMember.from(api.selfMember)] : [],
      false,
    );
  }

  public static create(items: Array<GroupMember>) {
    return new GroupMemberList(items, true);
  }

  constructor(items: Array<GroupMember>, isLoaded: boolean) {
    this.items = items;
    this.isLoaded = isLoaded;
  }
}

export default GroupMemberList;
