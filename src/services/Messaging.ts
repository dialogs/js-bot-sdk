/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Metadata } from 'grpc';
import { dialog } from '@dlghq/dialog-api';
import Service, { Config } from './Service';
import { TryCatchWrapper } from '../entities/utils';

class Messaging extends Service<any> {
  constructor(config: Config) {
    super(dialog.Messaging, config);
  }

  @TryCatchWrapper
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

  @TryCatchWrapper
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

  @TryCatchWrapper
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

  @TryCatchWrapper
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

  @TryCatchWrapper
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

  @TryCatchWrapper
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
