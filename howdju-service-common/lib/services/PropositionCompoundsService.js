const Promise = require("bluebird");

const map = require("lodash/map");
const merge = require("lodash/merge");
const zip = require("lodash/zip");

const { ActionTargetTypes, ActionTypes } = require("howdju-common");

const { EntityValidationError } = require("../serviceErrors");

exports.PropositionCompoundsService = class PropositionCompoundsService {
  constructor(
    propositionCompoundValidator,
    actionsService,
    propositionsService,
    propositionCompoundsDao
  ) {
    this.actionsService = actionsService;
    this.propositionCompoundValidator = propositionCompoundValidator;
    this.propositionsService = propositionsService;
    this.propositionCompoundsDao = propositionCompoundsDao;
  }

  readPropositionCompoundForId(propositionCompoundId, { authToken }) {
    return this.propositionCompoundsDao.read(propositionCompoundId);
  }

  createPropositionCompoundAsUser(propositionCompound, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors =
          this.propositionCompoundValidator.validate(propositionCompound);
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors);
        }
        return userId;
      })
      .then((userId) =>
        this.createValidPropositionCompoundAsUser(
          propositionCompound,
          userId,
          now
        )
      );
  }

  createValidPropositionCompoundAsUser(propositionCompound, userId, now) {
    return Promise.resolve()
      .then(() =>
        propositionCompound.id
          ? propositionCompound
          : this.propositionCompoundsDao.readPropositionCompoundEquivalentTo(
              propositionCompound
            )
      )
      .then((equivalentPropositionCompound) => {
        const isExtant = !!equivalentPropositionCompound;
        return Promise.all([
          isExtant,
          isExtant
            ? equivalentPropositionCompound
            : this.propositionCompoundsDao.createPropositionCompound(
                userId,
                propositionCompound,
                now
              ),
          propositionCompound.atoms,
        ]);
      })
      .then(([isExtant, propositionCompound, propositionCompoundAtoms]) =>
        Promise.all([
          isExtant,
          propositionCompound,
          isExtant
            ? propositionCompound.atoms
            : this.createPropositionCompoundAtoms(
                propositionCompound,
                propositionCompoundAtoms,
                userId,
                now
              ),
        ])
      )
      .then(([isExtant, propositionCompound, propositionCompoundAtoms]) => {
        const actionType = isExtant
          ? ActionTypes.TRY_CREATE_DUPLICATE
          : ActionTypes.CREATE;
        this.actionsService.asyncRecordAction(
          userId,
          now,
          actionType,
          ActionTargetTypes.PROPOSITION_COMPOUND,
          propositionCompound.id
        );

        propositionCompound.atoms = propositionCompoundAtoms;
        return {
          isExtant,
          propositionCompound,
        };
      });
  }

  createPropositionCompoundAtoms(
    propositionCompound,
    propositionCompoundAtoms,
    userId,
    now
  ) {
    return Promise.resolve()
      .then(() =>
        Promise.all(
          map(propositionCompoundAtoms, (atom) =>
            atom.entity.id
              ? [atom, { isExtant: true, proposition: atom.entity }]
              : Promise.all([
                  atom,
                  this.propositionsService.readOrCreatePropositionAsUser(
                    atom.entity,
                    userId,
                    now
                  ),
                ])
          )
        )
      )
      .then((atomsWithPropositions) =>
        map(atomsWithPropositions, ([atom, { proposition }]) => {
          atom.entity = proposition;
          return atom;
        })
      )
      .then((atoms) =>
        Promise.all([
          atoms,
          Promise.all(
            map(atoms, (atom, index) =>
              this.propositionCompoundsDao.createPropositionCompoundAtom(
                propositionCompound,
                atom,
                index
              )
            )
          ),
        ])
      )
      .then(([atoms, dbAtoms]) => {
        // Merging ensures that both the proposition text and atom IDs will be present
        const merged = map(zip(atoms, dbAtoms), ([atom, dbAtom]) =>
          merge(atom, dbAtom)
        );
        return merged;
      });
  }
};
