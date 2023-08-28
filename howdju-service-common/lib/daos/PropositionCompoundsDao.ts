import {
  merge,
  assign,
  concat,
  flatMap,
  forEach,
  head,
  isNull,
  mapValues,
  map,
  sortBy,
  values,
  isUndefined,
  toNumber,
  toString,
  omit,
} from "lodash";
import { Moment } from "moment";

import {
  CreatePropositionCompound,
  CreatePropositionCompoundAtom,
  EntityId,
  JustificationBasisTypes,
  JustificationRootTargetType,
  JustificationRootTargetTypes,
  Logger,
  newImpossibleError,
  PropositionCompoundAtomOut,
  toJson,
  toSlug,
} from "howdju-common";

import {
  toPropositionCompound,
  toPropositionCompoundAtom,
  ToPropositionCompoundAtomMapperRow,
} from "./orm";
import { normalizeText, toIdString } from "./daosUtil";
import { Database } from "../database";
import { PropositionCompoundRow } from "./dataTypes";

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
const atomPropositionCreatorLongNameRegExp = new RegExp(
  /^atom_proposition_creator_long_name_(\d+)$/
);
const atomPropositionIdRegExp = new RegExp(/^atom_proposition_id_(\d+)$/);
const atomOrderPositionRegExp = new RegExp(/^atom_order_position_(\d+)$/);

export class PropositionCompoundsDao {
  constructor(
    private readonly logger: Logger,
    private readonly database: Database
  ) {}

  createPropositionCompound(
    userId: EntityId,
    _propositionCompound: CreatePropositionCompound,
    now: Moment
  ) {
    const sql = `
      insert into proposition_compounds (creator_user_id, created) values ($1, $2) returning *
    `;
    return this.database
      .query<PropositionCompoundRow>("createPropositionCompound", sql, [
        userId,
        now,
      ])
      .then(({ rows: [row] }) => toPropositionCompound(row));
  }

  async createPropositionCompoundAtom(
    createPropositionCompound: CreatePropositionCompound & { id: EntityId },
    createPropositionCompoundAtom: CreatePropositionCompoundAtom,
    orderPosition: number
  ) {
    await this.database.query<ToPropositionCompoundAtomMapperRow>(
      "createPropositionCompoundAtom",
      `
        insert into proposition_compound_atoms (proposition_compound_id, proposition_id, order_position)
          values ($1, $2, $3)`,
      [
        createPropositionCompound.id,
        createPropositionCompoundAtom.entity.id,
        orderPosition,
      ]
    );

    return {
      propositionCompoundId: createPropositionCompound.id,
      entity: createPropositionCompoundAtom.entity,
    };
  }

  async read(propositionCompoundId: EntityId) {
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
          , u.long_name as proposition_creator_long_name
        from proposition_compounds pc
          join proposition_compound_atoms pca on
                pc.proposition_compound_id = $1
            and pca.proposition_compound_id = pc.proposition_compound_id
            and pc.deleted is null
          join propositions p on
                p.proposition_id = pca.proposition_id
            and p.deleted is null
          join users u on
                u.user_id = p.creator_user_id
            and u.deleted is null
        order by pc.proposition_compound_id, pca.order_position
          `;
    const { rows } = await this.database.query<
      PropositionCompoundRow & ToPropositionCompoundAtomMapperRow
    >("createPropositionCompoundAtom", sql, [propositionCompoundId]);
    const row = head(rows);
    if (!row) {
      return undefined;
    }
    const atoms = rows.map(toPropositionCompoundAtom).map((atom) => {
      if (isUndefined(atom)) {
        throw newImpossibleError(
          `PropositionCompoundAtom was mapped to undefined for propositionCompoundId: ${propositionCompoundId}`
        );
      }
      return atom;
    });
    return toPropositionCompound(row, atoms);
  }

  readPropositionCompoundEquivalentTo(
    createPropositionCompound: CreatePropositionCompound
  ) {
    const selects = flatMap(createPropositionCompound.atoms, (_atom, index) => [
      `pca${index}.order_position as atom_order_position_${index}`,
      `p${index}.text as atom_proposition_text_${index}`,
      `p${index}.normal_text as atom_proposition_normal_text_${index}`,
      `p${index}.proposition_id as atom_proposition_id_${index}`,
      `p${index}.created as atom_proposition_created_${index}`,
      `p${index}.creator_user_id as atom_proposition_creator_user_id_${index}`,
      `u${index}.long_name as atom_proposition_creator_long_name_${index}`,
    ]);
    const selectsSql = selects.join("\n,");
    const joins = map(
      createPropositionCompound.atoms,
      (_atom, index) => `
        join proposition_compound_atoms pca${index} on
              pc.deleted is null
          and pc.proposition_compound_id = pca${index}.proposition_compound_id
          and pca${index}.order_position = $${2 * index + 2}
        join propositions p${index} on
              p${index}.deleted is null
          and pca${index}.proposition_id = p${index}.proposition_id
          and p${index}.normal_text = $${2 * index + 3}
        join users u${index} on
              u${index}.deleted is null
          and p${index}.creator_user_id = u${index}.user_id
          `
    );
    const joinsSql = joins.join("\n");
    const args = concat(
      createPropositionCompound.atoms.length,
      flatMap(createPropositionCompound.atoms, (atom, index) => [
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
    //       pc.proposition_compound_id
    //     , pca.order_position
    //     , s.proposition_id
    //     , s.text
    //   from
    //     proposition_compounds pc
    //       join proposition_compound_atoms pca on
    //             pc.proposition_compound_id = pca.proposition_compound_id
    //         and pc.deleted is null
    //       join propositions s on
    //             pca.proposition_id = s.proposition_id
    //         and s.normal_text = any ($1)
    //         and s.deleted is null
    //   having count(s.proposition_id) over (partition by pc.proposition_compound_id) = $2
    //   order by pc.proposition_compound_id, pca.order_position
    // `

    return this.database
      .query<PropositionCompoundRow>(
        "readPropositionCompoundEquivalentTo",
        sql,
        args
      )
      .then(({ rows }) => {
        if (rows.length < 1) {
          return undefined;
        }
        if (rows.length > createPropositionCompound.atoms.length) {
          const dupeCount =
            rows.length / createPropositionCompound.atoms.length;
          this.logger.error(
            `${dupeCount} proposition compounds equivalent to: ${toJson(
              createPropositionCompound
            )}`
          );
        }

        const row = rows[0];
        const propositionCompoundId = toIdString(row.proposition_compound_id);

        // Reconstruct the atoms from the columns of the result
        const atomsByIndex: Record<
          number,
          Partial<PropositionCompoundAtomOut & { orderPosition: number }>
        > = {};
        forEach(row, (value, name) => {
          let match;
          // TODO(439) we should be re-using the ORM mappers and not duplicating the logic here
          if (!isNull((match = atomPropositionTextRegExp.exec(name)))) {
            const atomIndex = toNumber(match[1]);
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, { text: value });
          } else if (
            !isNull((match = atomPropositionNormalTextRegExp.exec(name)))
          ) {
            const atomIndex = toNumber(match[1]);
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, {
              normalText: value,
              slug: toSlug(toString(value)),
            });
          } else if (!isNull((match = atomPropositionIdRegExp.exec(name)))) {
            const atomIndex = toNumber(match[1]);
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, {
              id: toIdString(toNumber(value)),
            });
          } else if (
            !isNull((match = atomPropositionCreatedRegExp.exec(name)))
          ) {
            const atomIndex = toNumber(match[1]);
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = assign({}, atom.entity, { created: value });
          } else if (
            !isNull((match = atomPropositionCreatorUserIdRegExp.exec(name)))
          ) {
            const atomIndex = toNumber(match[1]);
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = merge({}, atom.entity, {
              creator: { id: toIdString(toNumber(value)) },
            });
          } else if (
            !isNull((match = atomPropositionCreatorLongNameRegExp.exec(name)))
          ) {
            const atomIndex = toNumber(match[1]);
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.entity = merge({}, atom.entity, {
              creator: { longName: value },
            });
          } else if (!isNull((match = atomOrderPositionRegExp.exec(name)))) {
            const atomIndex = toNumber(match[1]);
            let atom = atomsByIndex[atomIndex];
            if (!atom) {
              atomsByIndex[atomIndex] = atom = { propositionCompoundId };
            }
            atom.orderPosition = toNumber(value);
          }
        });

        const atoms = sortBy(
          values(atomsByIndex) as (PropositionCompoundAtomOut & {
            orderPosition: number;
          })[],
          (a) => a.orderPosition
        ).map((atom) =>
          omit(atom, "orderPosition")
        ) as PropositionCompoundAtomOut[];
        return toPropositionCompound(row, atoms);
      });
  }

  readPropositionCompoundsByIdForRootPropositionId(propositionId: EntityId) {
    return this.readPropositionCompoundsByIdForRootTarget(
      JustificationRootTargetTypes.PROPOSITION,
      propositionId
    );
  }

  readPropositionCompoundsByIdForRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId
  ) {
    return this.readPropositionAtomsByPropositionCompoundIdForRootPropositionId(
      rootTargetType,
      rootTargetId
    ).then((atomsByCompoundPropositionId) => {
      return mapValues(
        atomsByCompoundPropositionId,
        ({ atoms, created, creator_user_id }, proposition_compound_id) =>
          toPropositionCompound(
            {
              proposition_compound_id: toNumber(proposition_compound_id),
              created,
              creator_user_id,
            },
            atoms
          )
      );
    });
  }

  private readPropositionAtomsByPropositionCompoundIdForRootPropositionId(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId
  ) {
    const sql = `
      select distinct
          pc.created as proposition_compound_created
        , pc.creator_user_id as proposition_compound_creator_user_id
        , pca.proposition_compound_id
        , pca.proposition_id
        , pca.order_position
        , pcap.creator_user_id as proposition_creator_user_id
        , pcap.text as proposition_text
        , pcap.created as proposition_created
      from
        justifications j
          join proposition_compounds pc on
                j.basis_type = $3
            and j.basis_id = pc.proposition_compound_id
            and j.root_target_type = $1
            and j.root_target_id = $2
            and j.deleted is null
            and pc.deleted is null
          join proposition_compound_atoms pca using (proposition_compound_id)
          join propositions pcap on
                pca.proposition_id = pcap.proposition_id
            and pcap.deleted is null
      order by
        pca.proposition_compound_id,
        pca.order_position
    `;
    return this.database
      .query<
        ToPropositionCompoundAtomMapperRow & {
          proposition_compound_created: Moment;
          proposition_compound_creator_user_id: number;
        }
      >(
        "readPropositionAtomsByPropositionCompoundIdForRootPropositionId",
        sql,
        [
          rootTargetType,
          rootTargetId,
          JustificationBasisTypes.PROPOSITION_COMPOUND,
        ]
      )
      .then(({ rows }) => {
        const propositionAtomsByPropositionCompoundId: Record<
          number,
          {
            creator_user_id: number;
            created: Moment;
            atoms: PropositionCompoundAtomOut[];
          }
        > = {};
        forEach(rows, (row) => {
          const propositionCompoundId = row.proposition_compound_id;
          if (
            !(propositionCompoundId in propositionAtomsByPropositionCompoundId)
          ) {
            propositionAtomsByPropositionCompoundId[propositionCompoundId] = {
              created: row.proposition_compound_created,
              creator_user_id: row.proposition_compound_creator_user_id,
              atoms: [],
            };
          }
          const propositionAtom = toPropositionCompoundAtom(row);
          if (isUndefined(propositionAtom)) {
            throw newImpossibleError(
              `PropositionCompoundAtom was mapped to undefined for propositionCompoundId: ${propositionCompoundId}`
            );
          }
          propositionAtomsByPropositionCompoundId[
            propositionCompoundId
          ].atoms.push(propositionAtom as PropositionCompoundAtomOut);
        });
        return propositionAtomsByPropositionCompoundId;
      });
  }
}
