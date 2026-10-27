import { fetchTokens } from './fetch_tokens.js';

const USERS = JSON.parse(open('./users.json'));

export default function () {
  const tokens = fetchTokens(USERS);
  console.log('Setup finished. Tokens generated:', Object.keys(tokens));
  return tokens;
}