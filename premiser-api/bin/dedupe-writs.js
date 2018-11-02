const Promise = require('bluebird')
const groupBy = require('lodash/groupBy')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')

// const {logger} = require('howdju-ops')

const {AppProvider} = require('../src/init')


const appProvider = new AppProvider()
const {database, pool} = appProvider

dedupeWrits()

function dedupeWrits() {
  return database.query('dedupeWrits.select',
    `
      with
        duplicates as (
          select 
              normal_title
            , min(writ_id) as min_writ_id
          from writs
          group by normal_title
          having count(normal_title) > 1
        )
      select 
          writ_id
        , min_writ_id
      from writs 
        join duplicates using (normal_title)
    `)
    .then(({rows}) => {
      const duplicateWritIdsByMinDuplicateWritId = mapValues(groupBy(rows, row => row.min_writ_id), group => map(group, row => row.writ_id))
      return duplicateWritIdsByMinDuplicateWritId
    })
    .then( (duplicateWritIdsByMinDuplicateWritId) => {
      return Promise.all([
        duplicateWritIdsByMinDuplicateWritId,
        Promise.all(map(duplicateWritIdsByMinDuplicateWritId, (duplicateWritIds, minDuplicateWritId) =>
          database.query(
            'dedupeWrits.update',
            `update writ_quotes set writ_id = $1 where writ_id = any ($2)`,
            [minDuplicateWritId, duplicateWritIds]
          )
        ))
      ])
    })
    // .then( ([duplicateWritIdsByMinDuplicateWritId]) => {
    //   // TODO delete in code?
    //   /* Here's SQL...
    //     with
    //       duplicate_normal_titles as (
    //         select normal_title
    //         from writs
    //         group by normal_title
    //         having count(normal_title) > 1
    //       )
    //       , duplicate_ids as (
    //         select writ_id from writs join duplicate_normal_titles using (normal_title)
    //       )
    //       , duplicate_ids_with_writ_quotes as (
    //         select writ_id, writ_quote_id from duplicate_ids left join writ_quotes using (writ_id)
    //       )
    //       , unreferenced_duplicates as (
    //         select * from duplicate_ids_with_writ_quotes where writ_quote_id is null
    //       )
    //     delete from writs where writ_id in (select writ_id from unreferenced_duplicates);
    //    */
    // })
    .finally(() => pool.end())
}