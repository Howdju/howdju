const assign = require("lodash/assign");
const concat = require("lodash/concat");
const flatMap = require("lodash/flatMap");
const forEach = require("lodash/forEach");
const head = require("lodash/head");
const isNull = require("lodash/isNull");
const mapValues = require("lodash/mapValues");
const map = require("lodash/map");
const sortBy = require("lodash/sortBy");
const values = require("lodash/values");
const { normalizeText } = require("./daosUtil");

const {
  JustificationBasisTypes,
  JustificationRootTargetTypes,
} = require("howdju-common");
const { toPropositionCompound, toPropositionCompoundAtom } = require("./orm");

const atomOrderPositionRegExp = new RegExp(/^atom_order_position_(\d+)$/);
const atomPropositionTextRegExp = new RegExp(/^atom_proposition_text_(\d+)$/);
const atomPropositionIdRegExp = new RegExp(/^atom_proposition_id_(\d+)$/);

exports.PropositionCompoundsDao = class PropositionCompoundsDao {
  constructor(logger, database) {
    this.logger = logger;
    this.database = database;
  }

  createPropositionCompound(userId, propositionCompound, now) {
    const sql = `
      insert into proposition_compounds (creator_user_id, created) values ($1, $2) returning *
    `;
    return this.database
      .query("createPropositionCompound", sql, [userId, now])
      .then(({ rows: [row] }) => toPropositionCompound(row));
  }

  createPropositionCompoundAtom(
    propositionCompound,
    propositionCompoundAtom,
    orderPosition
  ) {
    return this.database
      .query(
        "createPropositionCompoundAtom",
        `
        insert into proposition_compound_atoms (proposition_compound_id, proposition_id, order_position)
          values ($1, $2, $3)
          returning *`,
        [
          propositionCompound.id,
          propositionCompoundAtom.entity.id,
          orderPosition,
        ]
      )
      .then(({ rows: [row] }) => toPropositionCompoundAtom(row));
  }

  read(propositionCompoundId) {
    const sql = `
        select
            sc.proposition_compound_id
          , sca.order_position
          , s.proposition_id
          , s.text as proposition_text
          , s.creator_user_id as proposition_creator_user_id
        from proposition_compounds sc
          join proposition_compound_atoms sca on
                sc.proposition_compound_id = $1
            and sca.proposition_compound_id = sc.proposition_compound_id
            and sc.deleted is null
          join propositions s on
                s.proposition_id = sca.proposition_id
            and s.deleted is null
        order by sc.proposition_compound_id, sca.order_position
          `;
    return this.database
      .query("createPropositionCompoundAtom", sql, [propositionCompoundId])
      .then(({ rows }) => {
        const row = head(rows);
        if (!row) {
          return null;
        }
        const atoms = map(rows, toPropositionCompoundAtom);
        return toPropositionCompound(row, atoms);
      });
  }

  readPropositionCompoundEquivalentTo(propositionCompound) {
    const selects = flatMap(propositionCompound.atoms, (atom, index) => [
      `sca${index}.order_position as atom_order_position_${index}`,
      `s${index}.text as atom_proposition_text_${index}`,
      `s${index}.proposition_id as atom_proposition_id_${index}`,
    ]);
    const selectsSql = selects.join("\n,");
    const joins = map(
      propositionCompound.atoms,
      (atom, index) => `
        join proposition_compound_atoms sca${index} on
              sc.deleted is null
          and sc.proposition_compound_id = sca${index}.proposition_compound_id
          and sca${index}.order_position = $${2 * index + 2}
        join propositions s${index} on
              s${index}.deleted is null
          and sca${index}.proposition_id = s${index}.proposition_id
          and s${index}.normal_text = $${2 * index + 3}
          `
    );
    const joinsSql = joins.join("\n");
    const args = concat(
      propositionCompound.atoms.length,
      flatMap(propositionCompound.atoms, (atom, index) => [
        index,
        normalizeText(atom.entity.text),
      ])
    );
    const sql = `
      with
        -- Without this limit, we would include compounds that included these propositions and more
        proposition_compounds_with_atom_count as (
          select
              sc.*
            , count(sca.proposition_id) over (partition by sc.proposition_compound_id) as proposition_atom_count
          from proposition_compounds sc
              join proposition_compound_atoms sca using (proposition_compound_id)
        )
        , proposition_compounds_having_same_atom_count as (
          select * from proposition_compounds_with_atom_count sc where proposition_atom_count = $1
        )
      select sc.proposition_compound_id, ${selectsSql}
      from proposition_compounds_having_same_atom_count sc ${joinsSql}
      order by sc.proposition_compound_id
    `;

    // An alternative that doesn't multiplex the result along columns
    // This doesn't get the equivalent order, though.  Could always check that in the code
    // const sql2 = `
    //   select
    //       sc.proposition_compound_id
    //     , sca.order_position
    //     , s.proposition_id
    //     , s.text
    //   from
    //     proposition_compounds sc
    //       join proposition_compound_atoms sca on
    //             sc.proposition_compound_id = sca.proposition_compound_id
    //         and sc.deleted is null
    //       join propositions s on
    //             sca.proposition_id = s.proposition_id
    //         and s.normal_text = any ($1)
    //         and s.deleted is null
    //   having count(s.proposition_id) over (partition by sc.proposition_compound_id) = $2
    //   order by sc.proposition_compound_id, sca.order_position
    // `

    return this.database
      .query("readPropositionCompoundEquivalentTo", sql, args)
      .then(({ rows }) => {
        if (rows.length < 1) {
          return null;
        }
        if (rows.length > 1) {
          this.logger.error(`${rows.length} equivalent proposition compounds`, {
            propositionCompound,
          });
        }

        const row = rows[0];
        const propositionCompoundId = row.proposition_compound_id;

        // Reconstruct the atoms from the columns of the result
        const atomsByIndex = {};
        forEach(row, (value, name) => {
          let match;
          // atomIndex ensures that the correct orderPosition and propositionText go together
          // atomIndex may not equal orderPosition; we don't know what scheme we might use to order atoms.
          if (!isNull((match = atomOrderPositionRegExp.exec(name)))) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.orderPosition = value;
          } else if (!isNull((match = atomPropositionTextRegExp.exec(name)))) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, { text: value });
          } else if (!isNull((match = atomPropositionIdRegExp.exec(name)))) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, { id: value });
          }
        });

        const atoms = sortBy(values(atomsByIndex), (a) => a.orderPosition);
        return toPropositionCompound(row, atoms);
      });
  }

  readPropositionCompoundsByIdForRootPropositionId(propositionId) {
    return this.readPropositionCompoundsByIdForRootTarget(
      JustificationRootTargetTypes.PROPOSITION,
      propositionId
    );
  }

  readPropositionCompoundsByIdForRootTarget(
    rootTargetType,
    rootTargetId,
    { userId }
  ) {
    return this.readPropositionAtomsByPropositionCompoundIdForRootPropositionId(
      rootTargetType,
      rootTargetId
    ).then((atomsByCompoundPropositionId) => {
      return mapValues(
        atomsByCompoundPropositionId,
        (propositionAtoms, propositionCompoundId) =>
          toPropositionCompound(
            { proposition_compound_id: propositionCompoundId },
            propositionAtoms
          )
      );
    });
  }

  readPropositionAtomsByPropositionCompoundIdForRootPropositionId(
    rootTargetType,
    rootTargetId
  ) {
    const sql = `
      select distinct
          sca.proposition_compound_id
        , sca.proposition_id
        , sca.order_position
        , scas.creator_user_id as proposition_creator_user_id
        , scas.text as proposition_text
        , scas.created as proposition_created
      from
        justifications j
          join proposition_compounds sc on
                j.basis_type = $3
            and j.basis_id = sc.proposition_compound_id
            and j.root_target_type = $1
            and j.root_target_id = $2
            and j.deleted is null
            and sc.deleted is null
          join proposition_compound_atoms sca using (proposition_compound_id)
          join propositions scas on
                sca.proposition_id = scas.proposition_id
            and scas.deleted is null
      order by
        sca.proposition_compound_id,
        sca.order_position
    `;
    return this.database
      .query(
        "readPropositionAtomsByPropositionCompoundIdForRootPropositionId",
        sql,
        [
          rootTargetType,
          rootTargetId,
          JustificationBasisTypes.PROPOSITION_COMPOUND,
        ]
      )
      .then(({ rows }) => {
        const propositionAtomsByPropositionCompoundId = {};
        forEach(rows, (row) => {
          const propositionCompoundId = row.proposition_compound_id;
          let propositionAtoms =
            propositionAtomsByPropositionCompoundId[propositionCompoundId];
          if (!propositionAtoms) {
            propositionAtomsByPropositionCompoundId[propositionCompoundId] =
              propositionAtoms = [];
          }
          const propositionAtom = toPropositionCompoundAtom(row);
          propositionAtoms.push(propositionAtom);
        });
        return propositionAtomsByPropositionCompoundId;
      });
  }
};
