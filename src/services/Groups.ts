/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';
import { Metadata } from 'grpc';

class Groups extends Service<any> {
  constructor(config: Config) {
    super(dialog.Groups, config);
  }

  createNewGroup(
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
