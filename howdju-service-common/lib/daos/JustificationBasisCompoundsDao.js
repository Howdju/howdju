const head = require('lodash/head')
const map = require('lodash/map')

const {
  toJustificationBasisCompound,
  toJustificationBasisCompoundAtom,
} = require('./orm')
const {
  mapSingle,
  mapMany,
} = require('./util')

exports.JustificationBasisCompoundsDao = class JustificationBasisCompoundsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
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
      `select * from justification_basis_compound_atoms where justification_basis_compound_id = $1 and deleted is null`,
      [justificationBasisCompoundId]
    )
      .then(mapMany(toJustificationBasisCompoundAtom))
  }

  readJustificationBasisCompoundHavingAtoms(atoms) {
    const sql = `
      with 
        compounds_having_correct_atom_count as (
          select justification_basis_compound_id
          from justification_basis_compound_atoms 
          group by justification_basis_compound_id 
          having count(justification_basis_compound_atom_id) = $1
        )
        , target_atoms as (
          select * from justification_basis_compound_atoms where justification_basis_compound_atom_id = any ($2) 
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
          having count(justification_basis_compound_atom_id) = $1
        )
      select * 
      from compounds_having_only_all_target_atoms 
      order by order_position 
    `
    const args = [atoms.length, atoms]
    return this.database.query(sql, args)
      .then( ({rows}) => {
        if (rows.length < 1) {
          return null
        }

        const justificationBasisCompound = toJustificationBasisCompound(head(rows))
        const atoms = map(rows, toJustificationBasisCompoundAtom)
        justificationBasisCompound.atoms = atoms

        return justificationBasisCompound
      })


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
  }

  createJustificationBasisCompound(justificationBasisCompound, userId, now) {
    return this.database.query(
      `insert into justification_basis_compounds (creator_user_id, created) values ($1, $2) returning *`,
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
