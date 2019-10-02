import { dialog } from '@dlghq/dialog-api/js';
import PeerType from './PeerType';

enum HistoryListMode {
  UNKNOWN = 'unknown',
  FORWARD = 'forward',
  BACKWARD = 'backward',
  BOTH = 'both',
}

export function historyListModeToApi(
  type: HistoryListMode,
): dialog.ListLoadMode {
  switch (type) {
    case HistoryListMode.FORWARD:
      return dialog.ListLoadMode.LISTLOADMODE_FORWARD;
    case HistoryListMode.BACKWARD:
      return dialog.ListLoadMode.LISTLOADMODE_BACKWARD;
    case HistoryListMode.BOTH:
      return dialog.ListLoadMode.LISTLOADMODE_BOTH;
    default:
      return dialog.ListLoadMode.LISTLOADMODE_BACKWARD;
  }
}

export default HistoryListMode;
