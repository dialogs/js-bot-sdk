/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';
import { TryCatchWrapper } from '../entities/utils';

class Authentication extends Service<any> {
  constructor(config: Config) {
    super(dialog.Authentication, config);
  }

  @TryCatchWrapper
  startTokenAuth(
    request: dialog.RequestStartTokenAuth,
    metadata?: Metadata,
  ): Promise<dialog.ResponseAuth> {
    return this.service.startTokenAuthAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  startUsernameAuth(
    request: dialog.RequestStartUsernameAuth,
    metadata?: Metadata,
  ): Promise<dialog.ResponseStartUsernameAuth> {
    console.log({ request, metadata });
    return this.service.startUsernameAuthAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  validatePassword(
    request: dialog.RequestValidatePassword,
    metadata?: Metadata,
  ): Promise<dialog.ResponseAuth> {
    return this.service.validatePasswordAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Authentication;
