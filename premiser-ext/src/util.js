
export function objectValues(object) {
  const entries = Object.entries(object)
  const values = []
  for (const entry of entries) {
    values.push(entry[1])
  }
  return values
}
