/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

class UnexpectedApiError extends Error {
  readonly name = 'UnexpectedApiError';

  constructor(field: string) {
    super(`Field "${field}" unexpectedly not found`);
  }
}

export default UnexpectedApiError;
