/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';

class Groups extends Service<any> {
  constructor(config: Config) {
    super(dialog.Groups, config);
  }

  loadMembers(
    request: dialog.RequestLoadMembers,
    metadata?: Metadata,
  ): Promise<dialog.ResponseLoadMembers> {
    return this.service.loadMembersAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  createGroup(
    request: dialog.RequestCreateGroup,
    metadata?: Metadata,
  ): Promise<dialog.ResponseCreateGroup> {
    return this.service.createGroupAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Groups;
