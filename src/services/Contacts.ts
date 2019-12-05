/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';
import { TryCatchWrapper } from '../entities/utils';

class Contacts extends Service<any> {
  constructor(config: Config) {
    super(dialog.Contacts, config);
  }

  @TryCatchWrapper
  searchContacts(
    request: dialog.RequestSearchContacts,
    metadata?: Metadata,
  ): Promise<dialog.ResponseSearchContacts> {
    return this.service.searchContactsAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Contacts;
