module.exports.removeDups = (idName, ...rowsArr) => {
  const seenIds = {}
  const deduped = []
  for (rows of rowsArr) {
    for (row of rows) {
      if (!seenIds[row[idName]]) {
        deduped.push(row)
        seenIds[row[idName]] = true
      }
    }
  }
  return deduped
}