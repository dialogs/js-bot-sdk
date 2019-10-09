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
    callback: Function = () => {},
  ): Promise<dialog.ResponseCreateGroup> {
    const options = this.getCallOptions();
    return this.service.createGroup(request, metadata, options, callback);
  }
}

export default Groups;
