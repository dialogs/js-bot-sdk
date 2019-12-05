/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';
import { TryCatchWrapper } from '../entities/utils';

class Parameters extends Service<any> {
  constructor(config: Config) {
    super(dialog.ConfigSync, config);
  }

  @TryCatchWrapper
  getParameters(
    request: dialog.RequestGetParameters,
    metadata?: Metadata,
  ): Promise<dialog.ResponseGetParameters> {
    return this.service.getParametersAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  @TryCatchWrapper
  editParameter(
    request: dialog.RequestEditParameter,
    metadata?: Metadata,
  ): Promise<dialog.ResponseSeq> {
    return this.service.editParameterAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Parameters;
