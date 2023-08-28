import { Moment } from "moment";

import {
  CreateAppearance,
  CreatePropositionCompound,
  EntityId,
  isDefined,
  toJson,
  utcNow,
} from "howdju-common";
import { ServicesProvider } from "howdju-service-common";
import { groupBy, uniqBy, zip } from "lodash";

import { MigrateProvider } from "./init/MigrateProvider";

const provider = new MigrateProvider() as ServicesProvider;

migrateJustificationBasisCompounds()
  .finally(() => provider.pool.end())
  .catch((err) => provider.logger.error({ err }));

async function migrateJustificationBasisCompounds() {
  const { rows: compoundRows } = await provider.database.query(
    "readJustificationBasisCompounds",
    `
      select
          jbca.justification_basis_compound_id
        , jbca.justification_basis_compound_atom_id
        , jbca.entity_type
        , jbc.creator_user_id as compound_creator_id
        , jbc.created as compound_created
        , p.text as proposition_atom_text
        , pp.text as paraphrasing_proposition_text
        , wq.writ_quote_id
        , sep.source_excerpt_paraphrase_id
        , sep.creator_user_id as source_excerpt_paraphrase_creator_user_id
        , sep.created as source_excerpt_paraphrase_created
      from justification_basis_compound_atoms jbca

        join justification_basis_compounds jbc using (justification_basis_compound_id)

        left join propositions p
          on
                jbca.entity_type = 'PROPOSITION'
            and jbca.entity_id = p.proposition_id

        left join source_excerpt_paraphrases sep
          on
                jbca.entity_type = 'SOURCE_EXCERPT_PARAPHRASE'
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
        left join propositions pp on sep.paraphrasing_proposition_id = pp.proposition_id
        left join writ_quotes wq
          on
                sep.source_excerpt_type = 'WRIT_QUOTE'
            and sep.source_excerpt_id = wq.writ_quote_id
    `
  );
  const rowsByCompoundId = groupBy(
    compoundRows,
    (row) => row.justification_basis_compound_id
  );
  provider.logger.info(`rowsByCompoundId: ${toJson(rowsByCompoundId)}`);

  const { rows: migrationRows } = await provider.database.query(
    "readWritQuoteMigrations",
    `select * from writ_quote_translations`
  );
  const mediaExcerptIdsByWritQuoteId = migrationRows.reduce(
    (acc, { writ_quote_id, media_excerpt_id }) => {
      acc[writ_quote_id] = media_excerpt_id;
      return acc;
    },
    {}
  );

  // For each compound-based justification:
  // - Each paraphrasing proposition should move to an indepenedent Appearance of its WritQuote's
  //   MediaExcerpt.
  // - All propositions (atom or paraphrasing) should become atoms of a new PropositionCompound-based justification
  //   of the same target.
  // - Update the justification to use the PropositionCompound instead of the JustificationCompound.
  // - delete the compoundJustifications
  for (const compoundId in rowsByCompoundId) {
    try {
      await convertCompound(
        compoundId,
        rowsByCompoundId,
        mediaExcerptIdsByWritQuoteId
      );
    } catch (err) {
      const compoundAtomRows = rowsByCompoundId[compoundId];
      provider.logger.error(
        `Failed to migrate justification basis compound ${compoundId} having rows ${toJson(
          compoundAtomRows
        )}`
      );
      throw err;
    }
  }
  provider.logger.info(`Done migrating justification basis compounds`);
}

async function convertCompound(
  compoundId: EntityId,
  rowsByCompoundId: Record<EntityId, any[]>,
  mediaExcerptIdsByWritQuoteId: Record<EntityId, EntityId>
) {
  await provider.database.transaction(
    "convertJustificationBasisCompound",
    "read uncommitted",
    "read write",
    async (client) => {
      const compoundAtomRows = rowsByCompoundId[compoundId];

      const provider = new MigrateProvider() as ServicesProvider;

      // Overwrite service/dao database with txn client so that they participate in the
      // transaction.

      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.appearancesDao.database = client;
      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.mediaExcerptsDao.database = client;
      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.propositionsService.database = client;
      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.propositionsDao.database = client;
      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.appearanceConfirmationsDao.db = client;
      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.usersDao.database = client;

      // @ts-ignore commit crimes against code by overwriting the database with the txn client
      provider.propositionCompoundsDao.database = client;

      const { rows } = await client.query(
        "readJustificationBasisCompoundJustifications",
        `
        select j.justification_id
        from justification_basis_compounds jbc
          join justifications j
            on
                  j.basis_type = 'JUSTIFICATION_BASIS_COMPOUND'
              and j.basis_id = jbc.justification_basis_compound_id
        where jbc.justification_basis_compound_id = $1
      `,
        [compoundId]
      );
      const justificationIds = rows.map((r) => r.justification_id);

      const paraphraseInfos = compoundAtomRows
        .map((row) =>
          row.paraphrasing_proposition_text
            ? {
                paraphrasingPropositionText: row.paraphrasing_proposition_text,
                mediaExcerptId: mediaExcerptIdsByWritQuoteId[row.writ_quote_id],
                sourceExcerptParaphraseId: row.source_excerpt_paraphrase_id,
                creatorUserId: row.source_excerpt_paraphrase_creator_user_id,
                createdAt: row.source_excerpt_paraphrase_created,
              }
            : undefined
        )
        .filter(isDefined);
      const createAppearanceInfos: {
        createAppearance: CreateAppearance;
        sourceExcerptParaphraseId: EntityId;
        creatorUserId: EntityId;
        createdAt: Moment;
      }[] = paraphraseInfos.map(
        ({
          creatorUserId,
          createdAt,
          sourceExcerptParaphraseId,
          paraphrasingPropositionText,
          mediaExcerptId,
        }) => ({
          creatorUserId,
          createdAt,
          sourceExcerptParaphraseId,
          createAppearance: {
            mediaExcerptId: mediaExcerptId,
            apparition: {
              type: "PROPOSITION",
              entity: {
                text: paraphrasingPropositionText,
              },
            },
          },
        })
      );

      provider.logger.info(
        `Creating ${createAppearanceInfos.length} appearances}`
      );

      // userId should be the same as created the source_excerpt_paraphrase.
      const appearanceInfos = await Promise.all(
        createAppearanceInfos.map(
          async ({
            creatorUserId,
            createdAt,
            createAppearance,
            sourceExcerptParaphraseId,
          }) => ({
            sourceExcerptParaphraseId,
            appearanceResult:
              await provider.appearancesService.createAppearance(
                { userId: creatorUserId },
                createAppearance,
                createdAt
              ),
          })
        )
      );
      await Promise.all(
        appearanceInfos.map(
          ({ appearanceResult: { appearance }, sourceExcerptParaphraseId }) =>
            client.query(
              "writeSourceExcerptParaphraseTranslation",
              `insert into source_excerpt_paraphrase_translations (source_excerpt_paraphrase_id, appearance_id) values ($1, $2)`,
              [sourceExcerptParaphraseId, appearance.id]
            )
        )
      );

      let createPropositionCompoundAtomInfos = compoundAtomRows.map((row) => {
        switch (row.entity_type) {
          case "PROPOSITION":
            return {
              atomId: row.justification_basis_compound_atom_id,
              propositionText: row.proposition_atom_text,
            };
          case "SOURCE_EXCERPT_PARAPHRASE":
            return {
              atomId: row.justification_basis_compound_atom_id,
              propositionText: row.paraphrasing_proposition_text,
            };
          default:
            throw new Error(`Unexpected entity_type: ${row.entity_type}`);
        }
      });
      // Some compounds have multiple atoms with the same proposition text.
      createPropositionCompoundAtomInfos = uniqBy(
        createPropositionCompoundAtomInfos,
        (info) => info.propositionText
      );
      if (createPropositionCompoundAtomInfos.length) {
        const createPropositionCompound: CreatePropositionCompound = {
          atoms: createPropositionCompoundAtomInfos.map(
            ({ propositionText }) => ({
              entity: {
                text: propositionText,
              },
            })
          ),
        };
        const { compound_creator_id: userId, compound_created: createdAt } =
          compoundAtomRows[0];
        const { propositionCompound } =
          await provider.propositionCompoundsService.createValidPropositionCompoundAsUser(
            createPropositionCompound,
            userId,
            createdAt
          );
        const translationRecordPromises = zip(
          propositionCompound.atoms.map(({ entity: { id } }) => id),
          createPropositionCompoundAtomInfos.map(({ atomId }) => atomId)
        ).map(([propositionCompoundAtomId, justificationBasisCompoundAtomId]) =>
          client.query(
            "writeJustificationBasisCompoundTranslation",
            `insert into justification_basis_compound_translations
            (justification_basis_compound_id, justification_basis_compound_atom_id, proposition_compound_id, proposition_compound_atom_id)
            values ($1, $2, $3, $4)`,
            [
              compoundId,
              justificationBasisCompoundAtomId,
              propositionCompound.id,
              propositionCompoundAtomId,
            ]
          )
        );
        const switchJustificationBasisPromises = justificationIds.map(
          (justificationId) =>
            client.query(
              "switchJustificationToPropositionCompound",
              `update justifications set basis_type = 'PROPOSITION_COMPOUND', basis_id = $2 where justification_id = $1`,
              [justificationId, propositionCompound.id]
            )
        );

        const deletedAt = utcNow();
        const deleteCompoundPromise = client.query(
          "deleteJustificationBasisCompound",
          `update justification_basis_compounds set deleted = $2 where justification_basis_compound_id = $1`,
          [compoundId, deletedAt]
        );
        const deleteSourceExcerptParaphrasePromises = compoundAtomRows
          .filter((row) => row.entity_type === "SOURCE_EXCERPT_PARAPHRASE")
          .map((row) =>
            client.query(
              "deleteSourceExcerptParaphrase",
              `update source_excerpt_paraphrases set deleted = $2 where source_excerpt_paraphrase_id = $1`,
              [row.source_excerpt_paraphrase_id, deletedAt]
            )
          );

        await Promise.all(
          switchJustificationBasisPromises
            .concat(translationRecordPromises)
            .concat([deleteCompoundPromise])
            .concat(deleteSourceExcerptParaphrasePromises)
        );
      }
    }
  );
}
