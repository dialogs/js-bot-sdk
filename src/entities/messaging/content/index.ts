/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { dialog } from '@dlghq/dialog-api';
import TextContent from './TextContent';
import ServiceContent from './ServiceContent';
import DocumentContent from './DocumentContent';
import DeletedContent from './DeletedContent';
import UnknownContent from './UnknownContent';

export type Content =
  | TextContent
  | ServiceContent
  | DocumentContent
  | DeletedContent
  | UnknownContent;

export {
  TextContent,
  ServiceContent,
  DocumentContent,
  DeletedContent,
  UnknownContent
}

export * from './document';

/**
 * @private
 */
export function apiToContent(api: dialog.MessageContent): Content {
  if (api.textMessage) {
    return TextContent.from(api.textMessage);
  }

  if (api.serviceMessage) {
    return ServiceContent.from(api.serviceMessage);
  }

  if (api.documentMessage) {
    return DocumentContent.from(api.documentMessage);
  }

  if (api.deletedMessage) {
    return DeletedContent.from(api.deletedMessage);
  }


  return UnknownContent.create();
}

/**
 * @private
 */
export function contentToApi(content: Content): dialog.MessageContent {
  switch (content.type) {
    case 'text':
    case 'document':
    case 'deleted':
      return content.toApi();

    default:
      throw Error(`Unexpected content type "${content.type}"`);
  }
}
