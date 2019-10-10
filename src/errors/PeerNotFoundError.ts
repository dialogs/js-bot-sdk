/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import { Peer } from '../entities';
import EntityNotFoundError from './EntityNotFoundError';

class PeerNotFoundError extends EntityNotFoundError<Peer> {
  constructor(peer: Peer) {
    super(peer);
  }
}

export default PeerNotFoundError;
