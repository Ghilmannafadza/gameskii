import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';

// DiceBear "Adventurer" by Lisa Wischofsky (CC BY 4.0), generated locally, no network needed.
const BG = ['2b5c9e', '1f7a8c', '6b4fa0', 'a0486b', 'b7832f', '2f8f5b', '3d4f9f', '8f3d3d'];
const cache = new Map<string, string>();

export function avatarFor(seed: string): string {
  const key = seed || 'gameskii';
  const hit = cache.get(key);
  if (hit) return hit;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const uri = createAvatar(adventurer, {
    seed: key,
    backgroundColor: [BG[h % BG.length]],
    backgroundType: ['solid'],
  }).toDataUri();
  cache.set(key, uri);
  return uri;
}
