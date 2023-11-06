import moment, { Moment } from "moment";
import {
  concat,
  filter,
  get,
  has,
  map,
  reduce,
  reject,
  some,
  toNumber,
  unionBy,
} from "lodash";

import {
  EntityTypes,
  SortDirections,
  ActionTypes,
  ActionTargetTypes,
  PropositionTagVotePolarities,
  tagEqual,
  EntityId,
  SortDescription,
  ContinuationToken,
  AuthToken,
  CreateProposition,
  CreateTag,
  UpdateProposition,
  makeModelErrors,
  utcNow,
  newImpossibleError,
  CreatePropositionTagVote,
  PropositionOut,
  PropositionCreatedAsType,
} from "howdju-common";

import { permissions } from "../permissions";
import {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} from "./pagination";
import {
  EntityNotFoundError,
  RequestValidationError,
  EntityConflictError,
  UserActionsConflictError,
  AuthorizationError,
  EntityTooOldToModifyError,
} from "../serviceErrors";
import {
  ActionsService,
  ApiConfig,
  AuthService,
  JustificationsDao,
  PermissionsDao,
  PropositionsDao,
  PropositionTagsService,
  PropositionTagVotesService,
  TagsService,
} from "..";
import { UserIdent } from "./types";
import { ensurePresent } from "./patterns";

const emptyPropositionsByVotePolarity = {
  [PropositionTagVotePolarities.POSITIVE]: [],
  [PropositionTagVotePolarities.NEGATIVE]: [],
};

export class PropositionsService {
  constructor(
    private readonly config: ApiConfig,
    private readonly actionsService: ActionsService,
    private readonly authService: AuthService,
    private readonly tagsService: TagsService,
    private readonly propositionTagsService: PropositionTagsService,
    private readonly propositionTagVotesService: PropositionTagVotesService,
    private readonly propositionsDao: PropositionsDao,
    private readonly permissionsDao: PermissionsDao,
    private readonly justificationsDao: JustificationsDao
  ) {}

  async readPropositionsForIds(
    userIdent: UserIdent,
    propositionIds: EntityId[]
  ): Promise<PropositionOut[]> {
    const userId = await this.authService.readOptionalUserIdForUserIdent(
      userIdent
    );
    const [
      propositions,
      tagsByPropositionId,
      recommendedTagsByPropositionId,
      propositionTagVotesByPropositionId,
      rootJustificationCountByPolarityByPropositionId,
      justificationBasisUsageCountByPropositionId,
      appearanceCountByPropositionId,
    ] = await Promise.all([
      this.propositionsDao.readPropositionsForIds(propositionIds),
      this.propositionTagsService.readTagsForPropositionIds(propositionIds),
      this.propositionTagsService.readRecommendedTagsForPropositionIds(
        propositionIds
      ),
      userId
        ? this.propositionTagVotesService.readUserVotesForPropositionIds(
            userId,
            propositionIds
          )
        : undefined,
      this.justificationsDao.readRootJustificationCountByPolarityForRoots(
        "PROPOSITION",
        propositionIds
      ),
      this.propositionsDao.readJustificationBasisUsageCountForPropositionIds(
        propositionIds
      ),
      this.propositionsDao.readAppearanceCountForPropositionIds(propositionIds),
    ]);
    ensurePresent(propositionIds, propositions, "PROPOSITION");

    return propositions.map((proposition) => {
      const tags = tagsByPropositionId[proposition.id] || [];
      const recommendedTags =
        recommendedTagsByPropositionId[proposition.id] || [];
      const propositionTagVotes =
        propositionTagVotesByPropositionId?.[proposition.id];
      const rootJustificationCountByPolarity =
        rootJustificationCountByPolarityByPropositionId[proposition.id];
      const justificationBasisUsageCount =
        justificationBasisUsageCountByPropositionId[proposition.id];
      const appearanceCount = appearanceCountByPropositionId[proposition.id];
      return {
        ...proposition,
        // Ensure recommended tags also appear in full tags
        tags: unionBy(tags, recommendedTags, (tag) => tag.id),
        recommendedTags,
        propositionTagVotes: propositionTagVotes?.filter((vote) =>
          // Include only votes for present tags
          some(tags, (tag) => tagEqual(tag, vote.tag))
        ),
        rootJustificationCountByPolarity,
        justificationBasisUsageCount,
        appearanceCount,
      };
    });
  }

  async readPropositionForId(propositionId: EntityId, userIdent: UserIdent) {
    const [proposition] = await this.readPropositionsForIds(userIdent, [
      propositionId,
    ]);
    return proposition;
  }

  readPropositions(
    userIdent: UserIdent,
    {
      sorts = [] as SortDescription[],
      continuationToken = undefined as ContinuationToken | undefined,
      count = 25,
    }
  ): Promise<{
    propositions: PropositionOut[];
    continuationToken: ContinuationToken;
  }> {
    const countNumber = toNumber(count);
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(
        `count must be a number. ${count} is not a number.`
      );
    }

    if (!continuationToken) {
      return this.readInitialPropositions(userIdent, sorts, countNumber);
    }
    return this.readMorePropositions(userIdent, continuationToken, countNumber);
  }

  async readInitialPropositions(
    userIdent: UserIdent,
    requestedSorts: SortDescription[],
    count: number
  ): Promise<{
    propositions: PropositionOut[];
    continuationToken: ContinuationToken;
  }> {
    const disambiguationSorts = [
      { property: "id", direction: SortDirections.ASCENDING },
    ];
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts);
    const propositionIds = await this.propositionsDao.readPropositionIds(
      unambiguousSorts,
      count
    );
    const propositions = await this.readPropositionsForIds(
      userIdent,
      propositionIds
    );
    const continuationToken = createContinuationToken(
      unambiguousSorts,
      propositions
    );
    return {
      propositions,
      continuationToken,
    };
  }

  async readMorePropositions(
    userIdent: UserIdent,
    continuationToken: ContinuationToken,
    count: number
  ): Promise<{
    propositions: PropositionOut[];
    continuationToken: ContinuationToken;
  }> {
    const { sorts, filters } = decodeContinuationToken(continuationToken);
    const propositionIds = await this.propositionsDao.readMorePropositionIds(
      sorts,
      count
    );
    const propositions = await this.readPropositionsForIds(
      userIdent,
      propositionIds
    );
    const nextContinuationToken =
      createNextContinuationToken(sorts, propositions, filters) ||
      continuationToken;
    return {
      propositions,
      continuationToken: nextContinuationToken,
    };
  }

  async updateProposition(
    authToken: AuthToken,
    updateProposition: UpdateProposition
  ) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const [
      equivalentPropositionsCount,
      hasPermission,
      isJustifiedByOtherUsers,
      hasJustificationsVotedOnByOtherUsers,
      isBasisForOtherUsersJustifications,
    ] = await Promise.all([
      this.propositionsDao.countEquivalentPropositions(updateProposition),
      this.permissionsDao.userHasPermission(
        userId,
        permissions.EDIT_ANY_ENTITY
      ),
      this.propositionsDao.hasOtherUsersRootedJustifications(
        updateProposition,
        userId
      ),
      this.propositionsDao.hasOtherUsersRootedJustificationsVotes(
        updateProposition,
        userId
      ),
      this.propositionsDao.isBasisToOtherUsersJustifications(
        updateProposition,
        userId
      ),
    ]);
    if (equivalentPropositionsCount > 0) {
      throw new EntityConflictError(
        makeModelErrors<CreateProposition>((p) =>
          p.text("Another proposition has equivalent text.")
        )
      );
    } else if (!hasPermission) {
      if (
        isJustifiedByOtherUsers ||
        hasJustificationsVotedOnByOtherUsers ||
        isBasisForOtherUsersJustifications
      ) {
        throw new UserActionsConflictError(
          makeModelErrors<UpdateProposition>((p) => {
            if (isJustifiedByOtherUsers) {
              p("Other users have added justifications for this proposition.");
            }
            if (hasJustificationsVotedOnByOtherUsers) {
              p(
                "Other users have voted on justifications for this proposition."
              );
            }
            if (isBasisForOtherUsersJustifications) {
              p(
                "Other users have used this proposition as a basis for justifications"
              );
            }
          })
        );
      }
    }
    const now = utcNow();
    const updatedProposition = await this.propositionsDao.updateProposition(
      updateProposition
    );
    if (!updatedProposition) {
      throw new EntityNotFoundError(
        EntityTypes.PROPOSITION,
        updateProposition.id
      );
    }
    await this.actionsService.recordAction(
      userId,
      now,
      ActionTypes.UPDATE,
      ActionTargetTypes.PROPOSITION,
      updatedProposition.id
    );
    return updatedProposition;
  }

  async deleteProposition(authToken: AuthToken, propositionId: EntityId) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const [hasPermission, dependentJustifications, proposition] =
      await Promise.all([
        this.permissionsDao.userHasPermission(
          userId,
          permissions.EDIT_ANY_ENTITY
        ),
        this.justificationsDao.readJustificationsDependentUponPropositionId(
          propositionId
        ),
        this.propositionsDao.readPropositionForId(propositionId),
      ]);

    if (!proposition) {
      throw new EntityNotFoundError(EntityTypes.PROPOSITION, propositionId);
    }

    const now = utcNow();

    if (!hasPermission) {
      const creatorUserId = get(proposition, "creator.id");
      if (!creatorUserId || userId !== creatorUserId) {
        throw new AuthorizationError(
          makeModelErrors<any>((a) =>
            a("Cannot delete other users' propositions.")
          )
        );
      }

      const graceCutoff = proposition.created.clone();
      graceCutoff.add(this.config.modifyEntityGracePeriod);
      const nowMoment = moment(now);
      if (nowMoment.isAfter(graceCutoff)) {
        throw new EntityTooOldToModifyError(
          this.config.modifyEntityGracePeriod
        );
      }

      const otherUsersJustificationsDependentUponProposition = filter(
        dependentJustifications,
        (j) => get(j, "creator.id") !== userId
      );
      if (otherUsersJustificationsDependentUponProposition.length > 0) {
        throw new UserActionsConflictError(
          makeModelErrors<any>((a) =>
            a(
              "Other users have added justifications based on this proposition."
            )
          )
        );
      }
    }

    const [deletedPropositionId, deletedJustificationIds] = await Promise.all([
      this.propositionsDao.deleteProposition(proposition, now),
      this.justificationsDao.deleteJustifications(dependentJustifications, now),
    ]);
    if (!deletedPropositionId) {
      throw new Error(
        `Failed to delete proposition we just read (id: ${propositionId})`
      );
    }
    if (deletedJustificationIds.some((id) => !id)) {
      const badIds = dependentJustifications.filter(
        (j) => !deletedJustificationIds.some((id) => id === j.id)
      );
      throw new Error(
        `Failed to delete justification we just read (missing IDs: ${badIds})`
      );
    }
    await Promise.all(
      [
        this.actionsService.recordAction(
          userId,
          now,
          ActionTypes.DELETE,
          ActionTargetTypes.PROPOSITION,
          deletedPropositionId
        ),
      ].concat(
        map(deletedJustificationIds, (id) => {
          if (!id) {
            throw newImpossibleError(
              `Justification ID cannot be undefined because we checked above.`
            );
          }
          return this.actionsService.recordAction(
            userId,
            now,
            ActionTypes.DELETE,
            ActionTargetTypes.JUSTIFICATION,
            id
          );
        })
      )
    );

    return {
      deletedPropositionId,
      deletedJustificationIds,
    };
  }

  async readOrCreateProposition(
    userIdent: UserIdent,
    proposition: CreateProposition
  ): Promise<{ isExtant: boolean; proposition: PropositionOut }> {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const now = utcNow();
    return this.readOrCreatePropositionAsUser(proposition, userId, now);
  }

  async readOrCreatePropositionAsUser(
    createProposition: CreateProposition,
    userId: EntityId,
    now: Moment
  ) {
    const { proposition, isExtant } =
      await this.readOrCreateEquivalentValidPropositionAsUser(
        createProposition,
        userId,
        now
      );

    let tagProps = {};
    if (createProposition.tags) {
      // When creating a proposition, assume all tags are also votes.
      // (Anti-votes don't make any sense, because anti-votes are votes against tags recommended by the system
      //  based upon other users' activity.  But new propositions don't have other user activity, and so have no
      //  recommended tags against which to vote)
      //
      // TODO(1,2,3): remove exception
      // eslint-disable-next-line promise/no-nesting
      const [tags, propositionTagVotes] = await this.readOrCreateTagsAndVotes(
        userId,
        proposition.id,
        createProposition.tags,
        now
      );
      tagProps = { tags, propositionTagVotes };
    }
    return {
      proposition: { ...proposition, ...tagProps },
      isExtant,
    };
  }

  async readPropositionsForTagId(tagId: EntityId, userIdent: UserIdent) {
    const userId = await this.authService.readOptionalUserIdForUserIdent(
      userIdent
    );

    const [recommendedPropositions, userTaggedPropositionsByVotePolarity] =
      await Promise.all([
        this.propositionTagsService.readPropositionsRecommendedForTagId(tagId),
        userId
          ? this.propositionTagsService.readTaggedPropositionsByVotePolarityAsUser(
              userId,
              tagId
            )
          : emptyPropositionsByVotePolarity,
      ]);
    const {
      POSITIVE: taggedPositivePropositions,
      NEGATIVE: taggedNegativePropositions,
    } = userTaggedPropositionsByVotePolarity;

    const taggedNegativePropositionIds = reduce(
      taggedNegativePropositions,
      (acc, p) => {
        acc[p.id] = true;
        return acc;
      },
      {} as Record<EntityId, boolean>
    );
    const prunedRecommendedPropositions = reject(recommendedPropositions, (p) =>
      has(taggedNegativePropositionIds, p.id)
    );
    const propositions = unionBy(
      taggedPositivePropositions,
      prunedRecommendedPropositions,
      (p) => p.id
    );

    return propositions;
  }
  private async readOrCreateEquivalentValidPropositionAsUser(
    createProposition: CreateProposition,
    userId: EntityId,
    now: Moment
  ) {
    const extantProposition = await this.propositionsDao.readPropositionByText(
      createProposition.text
    );

    const isExtant = !!extantProposition;
    const proposition = isExtant
      ? extantProposition
      : await this.propositionsDao.createProposition(
          userId,
          createProposition,
          now
        );
    const actionType = isExtant
      ? ActionTypes.TRY_CREATE_DUPLICATE
      : ActionTypes.CREATE;
    await this.actionsService.recordAction(
      userId,
      now,
      actionType,
      ActionTargetTypes.PROPOSITION,
      proposition.id
    );

    return {
      isExtant,
      proposition,
    };
  }

  async readOrCreatePropositionTagVote(
    authToken: AuthToken,
    createPropositionTagVote: CreatePropositionTagVote
  ) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const now = utcNow();
    const tag = await this.tagsService.readOrCreateValidTagAsUser(
      userId,
      createPropositionTagVote.tag,
      now
    );

    let proposition;
    // TODO(452) remove CreateProposition.id and use `"id" in createPropositionTagVote.proposition`
    // instead (and switch the conditonal blocks)
    if ("text" in createPropositionTagVote.proposition) {
      const result = await this.readOrCreateProposition(
        { userId },
        createPropositionTagVote.proposition
      );
      proposition = result.proposition;
    } else {
      proposition = await this.readPropositionForId(
        createPropositionTagVote.proposition.id,
        { userId }
      );
    }
    const propositionTagVote =
      await this.propositionTagVotesService.readOrCreatePropositionTagVoteAsUser(
        userId,
        proposition.id,
        tag,
        createPropositionTagVote.polarity,
        now
      );
    return {
      ...propositionTagVote,
      proposition,
      tag,
    };
  }

  private async readOrCreateTagsAndVotes(
    userId: EntityId,
    propositionId: EntityId,
    createTags: CreateTag[],
    now: Moment
  ) {
    const tags = await Promise.all(
      createTags.map((createTag) =>
        this.tagsService.readOrCreateValidTagAsUser(userId, createTag, now)
      )
    );
    const propositionTagVotes = await Promise.all(
      tags.map((tag) => {
        return this.propositionTagVotesService.readOrCreatePropositionTagVoteAsUser(
          userId,
          propositionId,
          tag,
          "POSITIVE",
          now
        );
      })
    );
    return [tags, propositionTagVotes];
  }

  async updateCreatedAs(
    propositionId: EntityId,
    entityType: PropositionCreatedAsType,
    entityId: EntityId
  ) {
    return await this.propositionsDao.updateCreatedAsForId(
      propositionId,
      entityType,
      entityId
    );
  }
}
