import { ArgumentParser } from "argparse";

import {
  CreateAppearance,
  CreatePropositionCompound,
  EntityId,
  isDefined,
} from "howdju-common";
import { ServicesProvider } from "howdju-service-common";
import { groupBy } from "lodash";

import { MigrateProvider } from "./init/MigrateProvider";

const parser = new ArgumentParser({
  description: "Convert WritQuotes to MediaExcerpts",
});
parser.add_argument("--test-one-only", { action: "store_true" });
const args = parser.parse_args();

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
        , pp.text as paraphrasing_proposition_text
        , wq.writ_quote_id
        , sep.creator_user_id as source_excerpt_paraphrase_creator_user_id
      from justification_basis_compound_atoms jbca
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
  // - Each paraphrasing proposition should become an appearance of its WritQuote's
  //   MediaExcerpt.
  // - The propositions (atom or paraphrasing) should become a PropositionCompound-based justification
  //   of the same target.
  // - delete the compoundJustifications
  for (const compoundId in rowsByCompoundId) {
    const rows = rowsByCompoundId[compoundId];

    const paraphraseInfos = rows
      .map((row) =>
        row.paraphrasing_proposition_text
          ? {
              paraphrasingPropositionText: row.paraphrasing_proposition_text,
              mediaExcerptId: mediaExcerptIdsByWritQuoteId[row.writ_quote_id],
              creatorUserId: row.source_excerpt_paraphrase_creator_user_id,
            }
          : undefined
      )
      .filter(isDefined);
    const createAppearanceInfos: {
      createAppearance: CreateAppearance;
      creatorUserId: EntityId;
    }[] = paraphraseInfos.map(
      ({ creatorUserId, paraphrasingPropositionText, mediaExcerptId }) => ({
        creatorUserId,
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
    await Promise.all(
      createAppearanceInfos.map(({ creatorUserId, createAppearance }) =>
        provider.appearancesService.createAppearance(
          { userId: creatorUserId },
          createAppearance,
          createdAt
        )
      )
    );

    const propositionIds = rows.map((row) => {
      switch (row.entity_type) {
        case "PROPOSITION":
          return row.entity_id;
        case "SOURCE_EXCERPT_PARAPHRASE":
          return row.paraphrasing_proposition_id;
      }
    });
    if (propositionIds.length) {
      const createPropositionCompound: CreatePropositionCompound = {
        atoms: propositionIds.map((id) => ({
          entity: {
            id,
          },
        })),
      };
      await provider.propositionCompoundsService.createPropositionCompoundAsUser(
        createPropositionCompound,
        userId,
        createdAt
      );
    }
  }
}
