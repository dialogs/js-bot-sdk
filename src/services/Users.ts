/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';

class Users extends Service<any> {
  constructor(config: Config) {
    super(dialog.Users, config);
  }

  loadFullUsers(
    request: dialog.RequestLoadFullUsers,
    metadata?: Metadata,
  ): Promise<dialog.ResponseLoadFullUsers> {
    return this.service.loadFullUsersAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Users;
