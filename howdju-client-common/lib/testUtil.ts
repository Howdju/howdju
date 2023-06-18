export function getElementById(id: string) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Could not find element with id ${id}`);
  }
  return element;
}
