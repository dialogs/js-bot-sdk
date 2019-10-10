/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';

export type Entities = {
  users: Array<dialog.User>;
  groups: Array<dialog.Group>;
};

export type PeerEntities = {
  users: Array<dialog.UserOutPeer>;
  groups: Array<dialog.GroupOutPeer>;
  groupMembersSubset?: dialog.GroupMembersSubset;
};

export type ResponseEntities<T> = {
  payload: T;
  users?: Array<dialog.User>;
  groups?: Array<dialog.Group>;
  peers?: Array<dialog.OutPeer>;
  userPeers?: Array<dialog.UserOutPeer>;
  groupPeers?: Array<dialog.GroupOutPeer>;
  groupMembersSubset?: dialog.GroupMembersSubset;
};
