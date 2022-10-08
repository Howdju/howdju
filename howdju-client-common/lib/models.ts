/** Types and functions relating to clients, including view models. */

import { JustificationBasisTypes, JustificationPolarities, JustificationRootPolarities, JustificationRootTargetTypes, JustificationTargetTypes } from "howdju-common"


export const makeJustificationViewModel = (props) => {
  let newJustification = {
    rootTargetType: JustificationRootTargetTypes.PROPOSITION,
    rootTarget: {id: null},
    polarity: JustificationPolarities.POSITIVE,
    rootPolarity: JustificationRootPolarities.POSITIVE,
    target: {
      type: JustificationTargetTypes.PROPOSITION,
      entity: {
        id: null
      }
    },
    basis: {
      type: JustificationBasisTypes.PROPOSITION_COMPOUND,
      // Store both these types directly on the basis for the view-model
      // Before the justification is sent to the server, the one corresponding to the current type should be put on the
      // entity property
      writQuote: makeWritQuote(),
      propositionCompound: makePropositionCompound(),
      justificationBasisCompound: makeJustificationBasisCompoundViewModel(),
    }
  }

  if (
    props &&
    props.basis &&
    props.basis.type === JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND &&
    props.basis.justificationBasisCompound
  ) {
    translateNewJustificationBasisCompoundAtomEntities(props.basis.justificationBasisCompound.atoms)
  }

  newJustification = merge(newJustification, props)

  setJustificationRootTarget(newJustification)

  return newJustification
}

function setJustificationRootTarget(justification) {
  let targetEntity = justification.target.entity
  let rootPolarity = justification.polarity
  while (targetEntity.target) {
    rootPolarity = targetEntity.polarity
    targetEntity = targetEntity.target.entity
  }
  justification.rootTarget = targetEntity
  justification.rootPolarity = rootPolarity
}

function translateNewJustificationBasisCompoundAtomEntities(atoms) {
  forEach(atoms, (atom) => {
    switch (atom.type) {
      case JustificationBasisCompoundAtomTypes.PROPOSITION:
        atom.proposition = atom.proposition || atom.entity
        break
      case JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE:
        atom.sourceExcerptParaphrase = atom.sourceExcerptParaphrase || atom.entity
        translateNewSourceExcerptEntity(atom.sourceExcerptParaphrase.sourceExcerpt)
        break
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomTypes', atom.type)
    }
    delete atom.entity
  })
}
