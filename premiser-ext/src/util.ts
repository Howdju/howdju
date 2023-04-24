export function arrayInsertAfter(items: any[], afterItem: any, item: any) {
  const afterIndex = items.indexOf(afterItem) + 1;
  const insertIndex = afterIndex > 0 ? afterIndex : items.length;
  items.splice(insertIndex, 0, item);
}

export function arrayInsertBefore(items: any[], afterItem: any, item: any) {
  const beforeIndex = items.indexOf(afterItem);
  const insertIndex = beforeIndex > -1 ? beforeIndex : items.length;
  items.splice(insertIndex, 0, item);
}
