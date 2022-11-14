export function objectValues(object) {
  const entries = Object.entries(object);
  const values = [];
  for (const entry of entries) {
    values.push(entry[1]);
  }
  return values;
}

export function arrayInsertAfter(items, afterItem, item) {
  items.splice(items.indexOf(afterItem) + 1, 0, item);
}

export function arrayInsertBefore(items, afterItem, item) {
  items.splice(items.indexOf(afterItem), 0, item);
}
