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

  peerSearch(
    request: dialog.RequestPeerSearch,
    metadata?: Metadata,
  ): Promise<dialog.ResponsePeerSearch> {
    return this.service.peerSearchAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Search;
