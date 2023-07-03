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
const { normalizeText, toIdString } = require("./daosUtil");

const {
  JustificationBasisTypes,
  JustificationRootTargetTypes,
  toJson,
  toSlug,
} = require("howdju-common");
const { toPropositionCompound, toPropositionCompoundAtom } = require("./orm");
const { merge } = require("lodash");

const atomPropositionTextRegExp = new RegExp(/^atom_proposition_text_(\d+)$/);
const atomPropositionNormalTextRegExp = new RegExp(
  /^atom_proposition_normal_text_(\d+)$/
);
const atomPropositionCreatedRegExp = new RegExp(
  /^atom_proposition_created_(\d+)$/
);
const atomPropositionCreatorUserIdRegExp = new RegExp(
  /^atom_proposition_creator_user_id_(\d+)$/
);
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

  async read(propositionCompoundId) {
    const sql = `
        select
            pc.proposition_compound_id
          , pc.created
          , pc.creator_user_id
          , pca.order_position
          , p.proposition_id
          , p.text as proposition_text
          , p.normal_text as proposition_normal_text
          , p.creator_user_id as proposition_creator_user_id
          , p.created as proposition_created
        from proposition_compounds pc
          join proposition_compound_atoms pca on
                pc.proposition_compound_id = $1
            and pca.proposition_compound_id = pc.proposition_compound_id
            and pc.deleted is null
          join propositions p on
                p.proposition_id = pca.proposition_id
            and p.deleted is null
        order by pc.proposition_compound_id, pca.order_position
          `;
    const { rows } = await this.database.query(
      "createPropositionCompoundAtom",
      sql,
      [propositionCompoundId]
    );
    const row = head(rows);
    if (!row) {
      return null;
    }
    const atoms = map(rows, toPropositionCompoundAtom);
    return toPropositionCompound(row, atoms);
  }

  readPropositionCompoundEquivalentTo(propositionCompound) {
    const selects = flatMap(propositionCompound.atoms, (atom, index) => [
      `pca${index}.order_position as atom_order_position_${index}`,
      `p${index}.text as atom_proposition_text_${index}`,
      `p${index}.normal_text as atom_proposition_normal_text_${index}`,
      `p${index}.proposition_id as atom_proposition_id_${index}`,
      `p${index}.created as atom_proposition_created_${index}`,
      `p${index}.creator_user_id as atom_proposition_creator_user_id_${index}`,
    ]);
    const selectsSql = selects.join("\n,");
    const joins = map(
      propositionCompound.atoms,
      (atom, index) => `
        join proposition_compound_atoms pca${index} on
              pc.deleted is null
          and pc.proposition_compound_id = pca${index}.proposition_compound_id
          and pca${index}.order_position = $${2 * index + 2}
        join propositions p${index} on
              p${index}.deleted is null
          and pca${index}.proposition_id = p${index}.proposition_id
          and p${index}.normal_text = $${2 * index + 3}
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
              pc.*
            , count(pca.proposition_id) over (partition by pc.proposition_compound_id) as proposition_atom_count
          from proposition_compounds pc
              join proposition_compound_atoms pca using (proposition_compound_id)
        )
        , proposition_compounds_having_same_atom_count as (
          select * from proposition_compounds_with_atom_count pc where proposition_atom_count = $1
        )
      select pc.proposition_compound_id, pc.created, pc.creator_user_id, ${selectsSql}
      from proposition_compounds_having_same_atom_count pc ${joinsSql}
      order by pc.proposition_compound_id
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
        if (rows.length > propositionCompound.atoms.length) {
          const dupeCount = rows.length / propositionCompound.atoms.length;
          this.logger.error(
            `${dupeCount} proposition compounds equivalent to: ${toJson(
              propositionCompound
            )}`
          );
        }

        const row = rows[0];
        const propositionCompoundId = toIdString(row.proposition_compound_id);

        // Reconstruct the atoms from the columns of the result
        const atomsByIndex = {};
        forEach(row, (value, name) => {
          let match;
          // TODO(439) we should be re-using the ORM mappers and not duplicating the logic here
          if (!isNull((match = atomPropositionTextRegExp.exec(name)))) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, { text: value });
          } else if (
            !isNull((match = atomPropositionNormalTextRegExp.exec(name)))
          ) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, {
              normalText: value,
              slug: toSlug(value),
            });
          } else if (!isNull((match = atomPropositionIdRegExp.exec(name)))) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, { id: toIdString(value) });
          } else if (
            !isNull((match = atomPropositionCreatedRegExp.exec(name)))
          ) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, { created: value });
          } else if (
            !isNull((match = atomPropositionCreatorUserIdRegExp.exec(name)))
          ) {
            const atomIndex = match[1];
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = merge({}, atom.entity, {
              creator: { id: toIdString(value), longName: "" },
            });
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
