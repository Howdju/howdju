const assign = require('lodash/assign')
const concat = require('lodash/concat')
const flatMap = require('lodash/flatMap')
const forEach = require('lodash/forEach')
const head = require('lodash/head')
const isNull = require('lodash/isNull')
const mapValues = require('lodash/mapValues')
const map = require('lodash/map')
const sortBy = require('lodash/sortBy')
const values = require('lodash/values')
const {normalizeText} = require("./util")

const {
  JustificationBasisType
} = require('howdju-common')
const {
  toStatementCompound,
  toStatementCompoundAtom,
} = require('./orm')

const atomOrderPositionRegExp = new RegExp(/^atom_order_position_(\d+)$/)
const atomStatementTextRegExp = new RegExp(/^atom_statement_text_(\d+)$/)
const atomStatementIdRegExp = new RegExp(/^atom_statement_id_(\d+)$/)

exports.StatementCompoundsDao = class StatementCompoundsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  createStatementCompound(userId, statementCompound, now) {
    const sql = `
      insert into statement_compounds (creator_user_id, created) values ($1, $2) returning *
    `
    return this.database.query(sql, [userId, now])
      .then( ({rows: [row]}) => toStatementCompound(row))
  }

  createStatementCompoundAtom(statementCompound, statementCompoundAtom, orderPosition) {
    return this.database.query(`
      insert into statement_compound_atoms (statement_compound_id, statement_id, order_position) 
        values ($1, $2, $3) 
        returning *`,
      [statementCompound.id, statementCompoundAtom.entity.id, orderPosition]
    )
      .then( ({rows: [row]}) => toStatementCompoundAtom(row) )
  }

  read(statementCompoundId) {
    const sql = `
        select 
            sc.statement_compound_id
          , sca.order_position
          , s.statement_id
          , s.text as statement_text
          , s.creator_user_id as statement_creator_user_id
        from statement_compounds sc 
          join statement_compound_atoms sca on 
                sc.statement_compound_id = $1
            and sca.statement_compound_id = sc.statement_compound_id
            and sc.deleted is null
          join statements s on
                s.statement_id = sca.statement_id
            and s.deleted is null
        order by sc.statement_compound_id, sca.order_position
          `
    return this.database.query(sql, [statementCompoundId])
      .then( ({rows}) => {
        const row = head(rows)
        if (!row) {
          return null
        }
        const atoms = map(rows, toStatementCompoundAtom)
        return toStatementCompound(row, atoms)
      })
  }

  readStatementCompoundEquivalentTo(statementCompound) {
    const selects = flatMap(statementCompound.atoms, (atom, index) => [
      `sca${index}.order_position as atom_order_position_${index}`,
      `s${index}.text as atom_statement_text_${index}`,
      `s${index}.statement_id as atom_statement_id_${index}`,
    ])
    const selectsSql = selects.join('\n,')
    const joins = map(statementCompound.atoms, (atom, index) => `
        join statement_compound_atoms sca${index} on 
              sc.deleted is null
          and sc.statement_compound_id = sca${index}.statement_compound_id 
          and sca${index}.order_position = $${2*index + 2}
        join statements s${index} on
              s${index}.deleted is null
          and sca${index}.statement_id = s${index}.statement_id 
          and s${index}.normal_text = $${2*index + 3}
          `)
    const joinsSql = joins.join("\n")
    const args = concat(
      statementCompound.atoms.length,
      flatMap(statementCompound.atoms, (atom, index) => [index, normalizeText(atom.entity.text)])
    )
    const sql = `
      with
        -- Without this limit, we would include compounds that included these statements and more
        statement_compounds_with_atom_count as (
          select 
              sc.*
            , count(sca.statement_id) over (partition by sc.statement_compound_id) as statement_atom_count
          from statement_compounds sc
              join statement_compound_atoms sca using (statement_compound_id)
        )
        , statement_compounds_having_same_atom_count as (
          select * from statement_compounds_with_atom_count sc where statement_atom_count = $1
        )
      select sc.statement_compound_id, ${selectsSql}
      from statement_compounds_having_same_atom_count sc ${joinsSql}
      order by sc.statement_compound_id
    `

    // An alternative that doesn't multiplex the result along columns
    // This doesn't get the equivalent order, though.  Could always check that in the code
    // const sql2 = `
    //   select
    //       sc.statement_compound_id
    //     , sca.order_position
    //     , s.statement_id
    //     , s.text
    //   from
    //     statement_compounds sc
    //       join statement_compound_atoms sca on
    //             sc.statement_compound_id = sca.statement_compound_id
    //         and sc.deleted is null
    //       join statements s on
    //             sca.statement_id = s.statement_id
    //         and s.normal_text = any ($1)
    //         and s.deleted is null
    //   having count(s.statement_id) over (partition by sc.statement_compound_id) = $2
    //   order by sc.statement_compound_id, sca.order_position
    // `

    return this.database.query(sql, args)
      .then( ({rows}) => {
        if (rows.length < 1) {
          return null
        }
        if (rows.length > 1) {
          this.logger.error(`Multiple statement compounds are equivalent to `, statementCompound)
        }

        const row = rows[0]
        const statementCompoundId = row.statement_compound_id

        // Reconstruct the atoms from the columns of the result
        const atomsByIndex = {}
        forEach(row, (value, name) => {
          let match
          // atomIndex ensures that the correct orderPosition and statementText go together
          // atomIndex may not equal orderPosition; we don't know what scheme we might use to order atoms.
          if (!isNull(match = atomOrderPositionRegExp.exec(name))) {
            const atomIndex = match[1]
            let atom = atomsByIndex[atomIndex]
            if (!atom) {
              atomsByIndex[atomIndex] = atom = {statementCompoundId}
            }
            atom.orderPosition = value
          } else if (!isNull(match = atomStatementTextRegExp.exec(name))) {
            const atomIndex = match[1]
            let atom = atomsByIndex[atomIndex]
            if (!atom) {
              atomsByIndex[atomIndex] = atom = {statementCompoundId}
            }
            atom.entity = assign({}, atom.entity, {text: value})
          } else if (!isNull(match = atomStatementIdRegExp.exec(name))) {
            const atomIndex = match[1]
            let atom = atomsByIndex[atomIndex]
            if (!atom) {
              atomsByIndex[atomIndex] = atom = {statementCompoundId}
            }
            atom.entity = assign({}, atom.entity, {id: value})
          }
        })

        const atoms = sortBy(values(atomsByIndex), a => a.orderPosition)
        return toStatementCompound(row, atoms)
      })
  }

  readStatementCompoundsByIdForRootStatementId(rootStatementId) {
    return this.readStatementAtomsByStatementCompoundIdForRootStatementId(rootStatementId)
      .then( atomsByCompoundStatementId => {
        return mapValues(atomsByCompoundStatementId, (statementAtoms, statementCompoundId) =>
          toStatementCompound({statement_compound_id: statementCompoundId}, statementAtoms))
      })
  }

  readStatementAtomsByStatementCompoundIdForRootStatementId(rootStatementId) {
    const sql = `
      select distinct
          sca.statement_compound_id
        , sca.statement_id
        , sca.order_position
        , scas.creator_user_id as statement_creator_user_id
        , scas.text as statement_text
        , scas.created as statement_created
      from
        justifications j  
          join statement_compounds sc on 
                j.basis_type = $2 
            and j.basis_id = sc.statement_compound_id
            and j.root_statement_id = $1
            and j.deleted is null
            and sc.deleted is null
          join statement_compound_atoms sca using (statement_compound_id)
          join statements scas on 
                sca.statement_id = scas.statement_id 
            and scas.deleted is null
      order by 
        sca.statement_compound_id,
        sca.order_position
    `
    return this.database.query(sql, [rootStatementId, JustificationBasisType.STATEMENT_COMPOUND])
      .then( ({rows}) => {
        const statementAtomsByStatementCompoundId = {}
        forEach(rows, row => {
          const statementCompoundId = row.statement_compound_id
          let statementAtoms = statementAtomsByStatementCompoundId[statementCompoundId]
          if (!statementAtoms) {
            statementAtomsByStatementCompoundId[statementCompoundId] = statementAtoms = []
          }
          const statementAtom = toStatementCompoundAtom(row)
          statementAtoms.push(statementAtom)
        })
        return statementAtomsByStatementCompoundId
      })
  }
}
