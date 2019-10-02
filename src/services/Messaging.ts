/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';

class Messaging extends Service<any> {
  constructor(config: Config) {
    super(dialog.Messaging, config);
  }

  fetchDialogIndex(
    request: dialog.RequestFetchDialogIndex,
    metadata?: Metadata,
  ): Promise<dialog.ResponseFetchDialogIndex> {
    return this.service.fetchDialogIndexAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  loadDialogs(
    request: dialog.RequestLoadDialogs,
    metadata?: Metadata,
  ): Promise<dialog.ResponseLoadDialogs> {
    return this.service.loadDialogsAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  sendMessage(
    request: dialog.RequestSendMessage,
    metadata?: Metadata,
  ): Promise<dialog.ResponseSendMessage> {
    return this.service.sendMessageAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  updateMessage(
    request: dialog.RequestUpdateMessage,
    metadata?: Metadata,
  ): Promise<dialog.ResponseSeqDate> {
    return this.service.updateMessageAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  loadHistory(
    request: dialog.RequestLoadHistory,
    metadata?: Metadata,
  ): Promise<dialog.ResponseLoadHistory> {
    return this.service.loadHistoryAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }

  readMessage(
    request: dialog.RequestMessageRead,
    metadata?: Metadata,
  ): Promise<void> {
    return this.service.messageReadAsync(
      request,
      metadata,
      this.getCallOptions(),
    );
  }
}

export default Messaging;
