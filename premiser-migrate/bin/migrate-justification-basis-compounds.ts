import { Moment } from "moment";

import {
  CreateAppearance,
  CreatePropositionCompound,
  EntityId,
  isDefined,
} from "howdju-common";
import { ServicesProvider } from "howdju-service-common";
import { groupBy } from "lodash";

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
        , jbca.entity_type
        , jbc.creator_user_id as compound_creator_id
        , jbc.created as compound_created
        , j.justification_id
        , p.text as proposition_atom_text
        , pp.text as paraphrasing_proposition_text
        , wq.writ_quote_id
        , sep.source_excerpt_paraphrase_id
        , sep.creator_user_id as source_excerpt_paraphrase_creator_user_id
        , sep.created as source_excerpt_paraphrase_created
      from justification_basis_compound_atoms jbca

        join justification_basis_compounds jbc using (justification_basis_compound_id)
        left join justifications j
          on
                j.basis_type = 'JUSTIFICATION_BASIS_COMPOUND'
            and j.basis_id = jbc.justification_basis_compound_id

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
    provider.database.transaction(
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

        const paraphraseInfos = compoundAtomRows
          .map((row) =>
            row.paraphrasing_proposition_text
              ? {
                  paraphrasingPropositionText:
                    row.paraphrasing_proposition_text,
                  mediaExcerptId:
                    mediaExcerptIdsByWritQuoteId[row.writ_quote_id],
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

        const propositionTexts = compoundAtomRows.map((row) => {
          switch (row.entity_type) {
            case "PROPOSITION":
              return row.proposition_atom_text;
            case "SOURCE_EXCERPT_PARAPHRASE":
              return row.paraphrasing_proposition_text;
          }
        });
        if (propositionTexts.length) {
          const createPropositionCompound: CreatePropositionCompound = {
            atoms: propositionTexts.map((text) => ({
              entity: {
                text,
              },
            })),
          };
          const { compound_creator_id: userId, compound_created: createdAt } =
            compoundAtomRows[0];
          const justificationId = compoundAtomRows[0].justification_id;
          const { propositionCompound } =
            await provider.propositionCompoundsService.createValidPropositionCompoundAsUser(
              createPropositionCompound,
              userId,
              createdAt
            );
          await Promise.all([
            client.query(
              "switchJustificationToPropositionCompound",
              `update justifications set basis_type = 'PROPOSITION_COMPOUND', basis_id = $2 where justification_id = $1`,
              [justificationId, propositionCompound.id]
            ),
            client.query(
              "writeJustificationBasisCompoundTranslation",
              `insert into justification_basis_compound_translations (justification_basis_compound_id, proposition_compound_id) values ($1, $2)`,
              [compoundId, propositionCompound.id]
            ),
          ]);
        }
      }
    );
  }
}
