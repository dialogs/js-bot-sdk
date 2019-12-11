/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */
class RetryOptions {
  public readonly maxRetries: number;
  public readonly minDelay: number;
  public readonly maxDelay: number;
  public readonly delayFactor: number;

  public constructor(
    maxRetries: number | null,
    minDelay: number | null,
    maxDelay: number | null,
    delayFactor: number | null,
  ) {
    if (maxRetries != null) this.maxRetries = maxRetries;
    else {
      this.maxRetries = 5;
    }
    if (minDelay != null) this.minDelay = minDelay;
    else {
      this.minDelay = 1;
    }
    if (maxDelay != null) this.maxDelay = maxDelay;
    else {
      this.maxDelay = 50;
    }
    if (delayFactor != null) this.delayFactor = delayFactor;
    else {
      this.delayFactor = Math.exp(1);
    }
  }

  public toString() {
    return `Peer(maxRetries=${this.maxRetries}, minDelay=${this.minDelay}, 
    maxDelay=${this.maxDelay}), retryFactor=${this.delayFactor}`;
  }
}

export default RetryOptions;
