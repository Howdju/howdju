const Promise = require('bluebird')
const forEach = require('lodash/forEach')
const head = require('lodash/head')
const join = require('lodash/join')
const map = require('lodash/map')

const {
  requireArgs,
  JustificationBasisType,
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
  pushAll,
  assert,
  isDefined,
} = require('howdju-common')

const {
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
  toProposition,
} = require('./orm')
const {
  mapSingle,
  mapMany,
  mapManyById,
} = require('./util')

exports.JustificationBasisCompoundsDao = class JustificationBasisCompoundsDao {

  constructor(logger, database, sourceExcerptParaphrasesDao) {
    requireArgs({logger, database, sourceExcerptParaphrasesDao})
    this.logger = logger
    this.database = database
    this.sourceExcerptParaphrasesDao = sourceExcerptParaphrasesDao
  }

  readJustificationBasisCompoundForId(justificationBasisCompoundId) {
    return this.database.query(
      `select * from justification_basis_compounds where justification_basis_compound_id = $1 and deleted is null`,
      [justificationBasisCompoundId]
    )
      .then(mapSingle(this.logger, toJustificationBasisCompound, 'justification_basis_compounds', {justificationBasisCompoundId}))
  }

  readAtomsForJustificationBasisCompoundId(justificationBasisCompoundId) {
    return this.database.query(
      `select * from justification_basis_compound_atoms 
       where justification_basis_compound_id = $1`,
      [justificationBasisCompoundId]
    )
      .then(mapMany(toJustificationBasisCompoundAtom))
  }

  readJustificationBasisCompoundHavingAtoms(targetAtoms) {
    const args = [
      targetAtoms.length
    ]
    const atomConditions = []
    forEach(targetAtoms, (atom, index) => {
      atomConditions.push(`entity_type = $${args.length+1} and entity_id = $${args.length+2} and order_position = $${args.length+3}`)
      pushAll(args, [
        atom.type,
        atom.entity.id,
        index
      ])
    })
    const atomConditionsSql = join(atomConditions, ' or ')
    const sql = `
      with 
        compounds_having_correct_atom_count as (
          select justification_basis_compound_id
          from justification_basis_compound_atoms 
          group by justification_basis_compound_id 
          having count(justification_basis_compound_atom_id) = $1
        )
        , target_atoms as (
          select * 
          from justification_basis_compound_atoms 
          where ${atomConditionsSql} 
        )
        , compounds_having_only_all_target_atoms as (
          select 
              c.*
            , a.*
          from justification_basis_compounds c
            -- ensure they don't have more atoms
            join compounds_having_correct_atom_count using (justification_basis_compound_id)
            -- ensure they have the target atoms
            join target_atoms a using (justification_basis_compound_id)
        )
      select * 
      from compounds_having_only_all_target_atoms 
      order by order_position 
    `
    return this.database.query(sql, args)
      .then( ({rows}) => {
        if (rows.length < 1) {
          return null
        }
        assert(rows.length === targetAtoms.length)

        // Each of the rows has the compound information, so just use the first
        const justificationBasisCompound = toJustificationBasisCompound(head(rows))
        const atoms = map(rows, toJustificationBasisCompoundAtom)
        justificationBasisCompound.atoms = atoms

        return justificationBasisCompound
      })
  }

  readJustificationBasisCompoundsByIdForRootPropositionId(rootPropositionId) {
    const sql = `
      with 
        -- it's possible that justifications rooted in the same proposition may use the same basis (either counters or different polarity)
        root_proposition_justification_basis_compounds as (
          select distinct
            jbc.*
          from justifications j 
            join justification_basis_compounds jbc on
                  j.basis_type = $1
              and j.basis_id = jbc.justification_basis_compound_id
          where
                j.root_proposition_id = $2
            and j.deleted is null
            and jbc.deleted is null
        )
      select
          jbc.*
        , jbca.*
      from root_proposition_justification_basis_compounds jbc 
          join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
        order by 
            jbca.justification_basis_compound_id
          , jbca.order_position
    `
    const args = [
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      rootPropositionId
    ]
    return Promise.all([
      this.database.query(sql, args),
      this.sourceExcerptParaphrasesDao.readSourceExcerptParaphrasesByIdForRootPropositionId(rootPropositionId),
      readAtomPropositionsForRootPropositionId(this.logger, this.database, rootPropositionId),
    ])
      .then( ([{rows}, sourceExcerptParaphrasesById, atomPropositionsById]) => {
        const justificationBasisCompoundsById = {}
        if (rows.length < 1) {
          return justificationBasisCompoundsById
        }

        forEach(rows, (row) => {
          const atom = toJustificationBasisCompoundAtom(row)

          let justificationBasisCompound = justificationBasisCompoundsById[atom.compoundId]
          // Each row has the compound information; so if we haven't seen one yet, grab it from the current row
          if (!justificationBasisCompound) {
            justificationBasisCompound = toJustificationBasisCompound(row)
            justificationBasisCompoundsById[justificationBasisCompound.id] = justificationBasisCompound
          }

          justificationBasisCompound.atoms.push(atom)

          switch (atom.type) {
            case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
              atom.entity = sourceExcerptParaphrasesById[atom.entity.id]
              break
            case JustificationBasisCompoundAtomType.PROPOSITION:
              atom.entity = atomPropositionsById[atom.entity.id]
              break
            default:
              throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
          }
          assert(isDefined(atom.entity))

        })
        return justificationBasisCompoundsById
      })
  }

  createJustificationBasisCompound(justificationBasisCompound, userId, now) {
    return this.database.query(
      `insert into justification_basis_compounds (creator_user_id, created)
       values ($1, $2) 
       returning *`,
      [userId, now]
    )
      .then(mapSingle(toJustificationBasisCompound))
  }

  createAtomForJustificationBasisCompoundId(
    justificationBasisCompoundId,
    atomType,
    atomEntityId,
    orderPosition
  ) {
    return this.database.query(`
      insert into justification_basis_compound_atoms (justification_basis_compound_id, entity_type, entity_id, order_position) 
        values ($1, $2, $3, $4) 
        returning *`,
      [justificationBasisCompoundId, atomType, atomEntityId, orderPosition]
    )
      .then(mapSingle(toJustificationBasisCompoundAtom))
  }
}

function readAtomPropositionsForRootPropositionId(logger, database, rootPropositionId) {
  const sql = `
      select
        s.*
      from justifications j 
          join justification_basis_compounds jbc on
                j.basis_type = $1
            and j.basis_id = jbc.justification_basis_compound_id
          join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          join propositions s on
                jbca.entity_type = $2
            and jbca.entity_id = s.proposition_id
        where 
              j.root_proposition_id = $3
          and j.deleted is null
          and jbc.deleted is null
          and s.deleted is null
    `
  const args = [
    JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
    JustificationBasisCompoundAtomType.PROPOSITION,
    rootPropositionId
  ]
  return database.query(sql, args)
    .then(mapManyById(toProposition))
}
