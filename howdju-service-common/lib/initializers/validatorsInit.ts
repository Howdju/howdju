import {
  WritValidator,
  WritQuoteValidator,
  CredentialValidator,
  JustificationBasisCompoundValidator,
  JustificationBasisCompoundAtomValidator,
  SourceExcerptValidator,
  SourceExcerptParaphraseValidator,
  PropositionValidator,
  PropositionTagVoteValidator,
  PropositionCompoundValidator,
  TagValidator,
  UrlValidator,
  UserValidator,
  JustificationVoteValidator,
} from "../validators";
import { LoggerProvider } from "./loggerInit";
import { SearchersProvider } from "./searchersInit";

export type ValidatorsProvider = ReturnType<typeof validatorsInitializer> &
  SearchersProvider;

export function validatorsInitializer(provider: LoggerProvider) {
  const urlValidator = new UrlValidator();
  const userValidator = new UserValidator();
  const tagValidator = new TagValidator();
  const justificationVoteValidator = new JustificationVoteValidator();
  const propositionTagVoteValidator = new PropositionTagVoteValidator();
  const propositionValidator = new PropositionValidator(tagValidator);
  const propositionCompoundValidator = new PropositionCompoundValidator(
    propositionValidator
  );
  const writValidator = new WritValidator();
  const writQuoteValidator = new WritQuoteValidator(
    writValidator,
    urlValidator
  );
  const sourceExcerptValidator = new SourceExcerptValidator(writQuoteValidator);
  const sourceExcerptParaphraseValidator = new SourceExcerptParaphraseValidator(
    propositionValidator,
    sourceExcerptValidator
  );
  const justificationBasisCompoundAtomValidator =
    new JustificationBasisCompoundAtomValidator(
      propositionValidator,
      sourceExcerptParaphraseValidator
    );
  const justificationBasisCompoundValidator =
    new JustificationBasisCompoundValidator(
      justificationBasisCompoundAtomValidator
    );
  const credentialValidator = new CredentialValidator();

  provider.logger.debug("validatorsInit complete");

  return {
    credentialValidator,
    justificationBasisCompoundValidator,
    propositionValidator,
    propositionCompoundValidator,
    propositionTagVoteValidator,
    urlValidator,
    userValidator,
    justificationVoteValidator,
    writValidator,
    writQuoteValidator,
  };
}
