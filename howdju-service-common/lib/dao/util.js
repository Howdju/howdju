exports.warnIfMultiple = (logger, rows, tableName, identifiers) => {
  if (rows.length > 1) {
    const identifiersString = join(map(identifiers, (val, key) => `${key} ${val}`), ', ')
    this.logger.warning(`Multiple ${table_name} for ${identifiersString}`)
  }
}
