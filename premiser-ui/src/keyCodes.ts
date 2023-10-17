export const RETURN_KEY_CODE = 13;
export const ESCAPE_KEY_CODE = 27;

export const keys = {
  ENTER: "Enter",
  COMMA: ",",
  BACKSPACE: "Backspace",
  DELETE: "Delete",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
} as const;

export const deleteKeys = [keys.BACKSPACE, keys.DELETE] as const;

export function isDeleteKey(key: string): key is typeof deleteKeys[number] {
  return deleteKeys.includes(key as typeof deleteKeys[number]);
}
