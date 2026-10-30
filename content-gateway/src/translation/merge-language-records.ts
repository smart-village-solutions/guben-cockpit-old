/** Merge only explicit/unambiguous identities. Unknown legacy records are never guessed. */
export async function mergeLanguageRecords<T>(options: {
  source: T[];
  target: T[];
  key: (item: T) => string | undefined;
  translate: (item: T) => Promise<T>;
  fill: (source: T, target: T) => Promise<T>;
}): Promise<T[]> {
  const result = [...options.target];
  const sourceKeys = options.source.map(options.key);
  const targetKeys = options.target.map(options.key);
  for (const [index, item] of options.source.entries()) {
    const key = sourceKeys[index];
    if (!key || sourceKeys.filter((candidate) => candidate === key).length !== 1) continue;
    const matches = targetKeys.flatMap((candidate, targetIndex) => candidate === key ? [targetIndex] : []);
    if (matches.length === 1) result[matches[0]] = await options.fill(item, result[matches[0]]);
    else if (matches.length === 0) result.push(await options.translate(item));
  }
  return result;
}
