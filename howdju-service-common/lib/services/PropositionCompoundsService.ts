import { isUndefined, map, merge, zip } from "lodash";

import {
  ActionTargetTypes,
  ActionTypes,
  CreatePropositionCompound,
  CreatePropositionCompoundAtom,
  EntityId,
  newImpossibleError,
  PropositionCompoundAtomOut,
  PropositionCompoundOut,
} from "howdju-common";

import { ActionsService } from "./ActionsService";
import { PropositionsService } from "./PropositionsService";
import { PropositionCompoundsDao } from "../daos";
import { Moment } from "moment";
import { EntityNotFoundError } from "..";

export class PropositionCompoundsService {
  constructor(
    private readonly actionsService: ActionsService,
    private readonly propositionsService: PropositionsService,
    private readonly propositionCompoundsDao: PropositionCompoundsDao
  ) {}

  async readPropositionCompoundForId(propositionCompoundId: EntityId) {
    const propositionCompound = await this.propositionCompoundsDao.read(
      propositionCompoundId
    );
    if (!propositionCompound) {
      throw new EntityNotFoundError(
        "PROPOSITION_COMPOUND",
        propositionCompoundId
      );
    }
    return propositionCompound;
  }

  async createValidPropositionCompoundAsUser(
    createPropositionCompound: CreatePropositionCompound,
    userId: EntityId,
    now: Moment
  ) {
    const equivalentPropositionCompound =
      await this.propositionCompoundsDao.readPropositionCompoundEquivalentTo(
        createPropositionCompound
      );
    const isExtant = !!equivalentPropositionCompound;
    let propositionCompound = isExtant
      ? equivalentPropositionCompound
      : await this.propositionCompoundsDao.createPropositionCompound(
          userId,
          createPropositionCompound,
          now
        );
    if (!isExtant) {
      propositionCompound = {
        ...propositionCompound,
        atoms: await this.createPropositionCompoundAtoms(
          propositionCompound,
          createPropositionCompound.atoms,
          userId,
          now
        ),
      };
    }

    const actionType = isExtant
      ? ActionTypes.TRY_CREATE_DUPLICATE
      : ActionTypes.CREATE;
    await this.actionsService.recordAction(
      userId,
      now,
      actionType,
      ActionTargetTypes.PROPOSITION_COMPOUND,
      propositionCompound.id
    );

    return {
      isExtant,
      propositionCompound,
    } as {
      isExtant: boolean;
      propositionCompound: PropositionCompoundOut;
    };
  }

  private async createPropositionCompoundAtoms(
    propositionCompound: CreatePropositionCompound & { id: EntityId },
    propositionCompoundAtoms: CreatePropositionCompoundAtom[],
    userId: EntityId,
    now: Moment
  ) {
    const propositions = await Promise.all(
      map(propositionCompoundAtoms, async (atom) =>
        atom.entity.id
          ? {
              isExtant: true,
              proposition: await this.propositionsService.readPropositionForId(
                atom.entity.id,
                { userId }
              ),
            }
          : this.propositionsService.readOrCreatePropositionAsUser(
              atom.entity,
              userId,
              now
            )
      )
    );
    const atomsWithPropositions = zip(propositionCompoundAtoms, propositions);
    const atoms = map(atomsWithPropositions, ([atom, propositionWrapper]) => {
      if (isUndefined(atom) || isUndefined(propositionWrapper)) {
        throw newImpossibleError(
          `atom or propositionWrapper is undefined propositionCompound: ${propositionCompound.id}`
        );
      }
      const { proposition } = propositionWrapper;
      atom.entity = proposition;
      return atom;
    });
    const dbAtoms = await Promise.all(
      map(atoms, (atom, index) =>
        this.propositionCompoundsDao.createPropositionCompoundAtom(
          propositionCompound,
          atom,
          index
        )
      )
    );
    // Merging ensures that both the proposition text and atom IDs will be present
    const merged = map(zip(atoms, dbAtoms), ([atom, dbAtom]) => {
      if (isUndefined(atom) || isUndefined(dbAtom)) {
        throw newImpossibleError(
          `atom or dbAtom is undefined propositionCompound: ${propositionCompound.id}`
        );
      }
      return merge(atom, dbAtom);
    });
    // TODO(#28) remove cast to unknown. (The two different ways we read a proposition above should
    // ensure that `created` is present on it...)
    return merged as unknown as PropositionCompoundAtomOut[];
  }
}
