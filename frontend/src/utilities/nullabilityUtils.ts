export const isNullOrUndefinedOrEmpty = (value: any[] | undefined | null) => {
  return isNullOrUndefined(value) || value?.length === 0;
}
export function isNullOrUndefinedOrWhiteSpace(value: string | undefined | null) {
  return value === null || value === undefined || /^\s*$/.test(value);
}

export function isNullOrUndefined(value: unknown) {
  return value === null || value === undefined;
}
