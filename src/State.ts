/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';
import {
  Group,
  OutPeer,
  Peer,
  User,
  PeerType,
  GroupOutPeer,
  GroupMember,
  GroupMemberList,
} from './entities';
import { Entities, PeerEntities, ResponseEntities } from './internal/types';
import mapNotNull from './utils/mapNotNull';
import { PeerNotFoundError } from './errors';
import { getOpt } from './entities/utils';

class State {
  public readonly self: User;
  public readonly users: Map<number, User> = new Map();
  public readonly groups: Map<number, Group> = new Map();
  public readonly groupMembers: Map<number, GroupMemberList> = new Map();
  public readonly dialogs: Array<Peer> = [];
  public readonly parameters: Map<string, string> = new Map();

  constructor(self: User) {
    this.self = self;
  }

  createOutPeer(peer: Peer): OutPeer {
    switch (peer.type) {
      case PeerType.PRIVATE:
        const user = this.users.get(peer.id);
        if (user) {
          return OutPeer.create(peer, user.accessHash);
        }
        break;

      case PeerType.GROUP:
        const group = this.groups.get(peer.id);
        if (group) {
          return OutPeer.create(peer, group.accessHash);
        }
        break;
    }

    throw new PeerNotFoundError(peer);
  }

  createGroupOutPeer(groupId: number): GroupOutPeer {
    const group = this.groups.get(groupId);
    if (group) {
      return group.getGroupOutPeer();
    }

    throw new PeerNotFoundError(Peer.group(groupId));
  }

  applyDialogs(dialogs: dialog.Dialog[]) {
    const mapped = mapNotNull(dialogs, (dialog) =>
      dialog.peer ? Peer.from(dialog.peer) : null,
    );
    this.dialogs.push(...mapped);
  }

  applyEntities({ users, groups }: Entities) {
    users.forEach((apiUser) => {
      const user = User.from(apiUser);
      this.users.set(user.id, user);
    });

    groups.forEach((apiGroup) => {
      const group = Group.from(apiGroup);
      this.groups.set(group.id, group);

      if (!this.groupMembers.has(apiGroup.id)) {
        this.groupMembers.set(apiGroup.id, GroupMemberList.from(apiGroup));
      }
    });
  }

  applyGroupMembers(groupId: number, members: Array<GroupMember>) {
    this.groupMembers.set(groupId, GroupMemberList.create(members));
  }

  applyResponseEntities({
    peers,
    users,
    groups,
    userPeers,
    groupPeers,
    groupMembersSubset,
  }: ResponseEntities<any>): PeerEntities {
    this.applyEntities({ users: users || [], groups: groups || [] });

    const filteredUsers = userPeers
      ? userPeers.filter((peer) => !this.users.has(peer.uid))
      : [];
    const filteredGroups = groupPeers
      ? groupPeers.filter((peer) => !this.groups.has(peer.groupId))
      : [];

    if (peers) {
      peers.forEach((peer) => {
        switch (peer.type) {
          case dialog.PeerType.PEERTYPE_PRIVATE:
            filteredUsers.push(
              dialog.UserOutPeer.create({
                uid: peer.id,
                accessHash: peer.accessHash,
              }),
            );
            break;
          case dialog.PeerType.PEERTYPE_GROUP:
            filteredGroups.push(
              dialog.GroupOutPeer.create({
                groupId: peer.id,
                accessHash: peer.accessHash,
              }),
            );
            break;
        }
      });
    }

    return {
      users: filteredUsers,
      groups: filteredGroups,
      groupMembersSubset:
        groupMembersSubset &&
        dialog.GroupMembersSubset.create({
          groupPeer: groupMembersSubset.groupPeer,
          memberIds: groupMembersSubset.memberIds.filter(
            (id) => !this.users.has(id),
          ),
        }),
    };
  }

  private hasPeer(peer: dialog.Peer) {
    switch (peer.type) {
      case dialog.PeerType.PEERTYPE_PRIVATE:
        return this.users.has(peer.id);

      case dialog.PeerType.PEERTYPE_GROUP:
        return this.groups.has(peer.id);

      default:
        return true;
    }
  }

  applyParameters(parameters: Map<string, string>) {
    parameters.forEach((value, key) => this.parameters.set(key, value));
  }

  checkEntities(update: dialog.UpdateSeqUpdate): Array<dialog.Peer> {
    const missingPeers: Array<dialog.Peer> = [];
    if (update.updateMessage) {
      if (
        update.updateMessage.peer &&
        !this.hasPeer(update.updateMessage.peer)
      ) {
        missingPeers.push(update.updateMessage.peer);
      }
    }

    return missingPeers;
  }

  applyUpdate(update: dialog.UpdateSeqUpdate) {
    if (update.updateParameterChanged) {
      this.handleParameterChanged(update.updateParameterChanged);
    }
  }

  private handleParameterChanged(update: dialog.UpdateParameterChanged) {
    const { key } = update;
    const value = getOpt(update.value, null);
    if (value === null) {
      this.parameters.delete(key);
    } else {
      this.parameters.set(key, value);
    }
  }
}

export default State;
