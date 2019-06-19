/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';
import { Group, OutPeer, Peer, User, PeerType } from './entities';
import { Entities, PeerEntities, ResponseEntities } from './internal/types';
import mapNotNull from './utils/mapNotNull';
import { PeerNotFoundError } from './errors';

class State {
  public readonly self: User;
  public readonly users: Map<number, User> = new Map();
  public readonly groups: Map<number, Group> = new Map();
  public readonly dialogs: Array<Peer> = [];

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

        throw new PeerNotFoundError(peer, `User #${peer.id} unexpectedly not found`);

      case PeerType.GROUP:
        const group = this.groups.get(peer.id);
        if (group) {
          return OutPeer.create(peer, group.accessHash);
        }

        throw new PeerNotFoundError(peer, `Group #${peer.id} unexpectedly not found`);

      default:
        throw new PeerNotFoundError(peer, `Unexpected peer type ${peer.type}`);
    }
  }

  applyDialogs(dialogs: dialog.Dialog[]) {
    const mapped = mapNotNull(dialogs, (dialog) => dialog.peer ? Peer.from(dialog.peer) : null);
    this.dialogs.push(...mapped);
  }

  applyEntities({ users, groups }: Entities) {
    users.forEach((apiUser) => {
      if (!this.users.has(apiUser.id)) {
        const user = User.from(apiUser);
        this.users.set(user.id, user);
      }
    });

    groups.forEach((apiGroup) => {
      if (!this.groups.has(apiGroup.id)) {
        const group = Group.from(apiGroup);
        this.groups.set(group.id, group);
      }
    });
  }

  applyResponseEntities({ users, groups, userPeers, groupPeers }: ResponseEntities<any>): PeerEntities {
    this.applyEntities({ users, groups });

    return {
      users: userPeers.filter((peer) => !this.users.has(peer.uid)),
      groups: groupPeers.filter((peer) => !this.groups.has(peer.groupId))
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

  checkEntities(update: dialog.UpdateSeqUpdate): Array<dialog.Peer> {
    const missingPeers: Array<dialog.Peer> = [];
    if (update.updateMessage) {
      if (update.updateMessage.peer && !this.hasPeer(update.updateMessage.peer)) {
        missingPeers.push(update.updateMessage.peer);
      }
    }

    return missingPeers;
  }

  applyUpdate(update: dialog.UpdateSeqUpdate) {

  }
}

export default State;
