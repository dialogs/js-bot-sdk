/*
 * Copyright 2018 Dialog LLC <info@dlg.im>
 */

import dotenv from 'dotenv';

function parseTestEnv() {
  dotenv.config();

  const env = (name: string): string => {
    const value = process.env[name];
    if (value) {
      return value;
    }

    throw new Error(`${name} env variable not defined`);
  };

  return {
    endpoint: env('BOT_ENDPOINT'),
    firstBotToken: env('BOT_TOKEN_FIRST'),
    secondBotToken: env('BOT_TOKEN_SECOND'),
  };
}

export default parseTestEnv;
