/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';
import { TryCatchWrapper } from '../entities/utils';

class Registration extends Service<any> {
  constructor(config: Config) {
    super(dialog.Registration, config);
  }

  @TryCatchWrapper
  registerDevice(
    request: dialog.RequestRegisterDevice,
    metadata?: Metadata,
  ): Promise<dialog.ResponseDeviceRequest> {
    return this.service.registerDeviceAsync(
      request,
      metadata,
      this.getCallOptions({ authRequired: false }),
    );
  }
}

export default Registration;
