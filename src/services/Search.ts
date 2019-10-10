/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';

class Search extends Service<any> {
  constructor(config: Config) {
    super(dialog.Search, config);
  }

  resolvePeer(
    request: dialog.RequestResolvePeer,
    metadata?: Metadata,
  ): Promise<dialog.ResponseResolvePeer> {
    return this.service.resolvePeerAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Search;
