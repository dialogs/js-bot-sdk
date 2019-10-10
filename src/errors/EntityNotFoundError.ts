/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

class EntityNotFoundError<ID> extends Error {
  readonly name = 'EntityNotFound';
  readonly id: ID;

  constructor(id: ID) {
    super(`Entity ${id} unexpectedly not found`);

    this.id = id;
  }
}

export default EntityNotFoundError;
