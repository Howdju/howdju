import Promise from "bluebird";
import moment from "moment";

import concat from "lodash/concat";
import filter from "lodash/filter";
import get from "lodash/get";
import has from "lodash/has";
import keys from "lodash/keys";
import map from "lodash/map";
import merge from "lodash/merge";
import pickBy from "lodash/pickBy";
import reduce from "lodash/reduce";
import reject from "lodash/reject";
import some from "lodash/some";
import toNumber from "lodash/toNumber";
import unionBy from "lodash/unionBy";
import unzip from "lodash/unzip";

import {
  EntityTypes,
  SortDirections,
  userActionsConflictCodes,
  entityConflictCodes,
  authorizationErrorCodes,
  ActionTypes,
  ActionTargetTypes,
  requireArgs,
  PropositionTagVotePolarities,
  makePropositionTagVote,
  tagEqual,
  EntityId,
  AuthToken,
  ContinuationToken,
  Proposition,
  CreateProposition,
  CreateTag,
  SortDescription,
} from "howdju-common";

import { PropositionValidator } from "../validators";
import { permissions } from "../permissions";
import {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} from "./pagination";
import {
  EntityNotFoundError,
  RequestValidationError,
  EntityValidationError,
  EntityConflictError,
  UserActionsConflictError,
  AuthorizationError,
  EntityTooOldToModifyError,
} from "../serviceErrors";
import { JustificationsDao, PermissionsDao, PropositionsDao } from "../daos";
import { ApiConfig } from "../config";
import { AuthService } from "./AuthService";
import { ActionsService } from "./ActionsService";
import { PropositionTagsService } from "./PropositionTagsService";
import { PropositionTagVotesService } from "./PropositionTagVotesService";
import { TagsService } from "./TagsService";

const emptyPropositionsByVotePolarity = {
  [PropositionTagVotePolarities.POSITIVE]: [],
  [PropositionTagVotePolarities.NEGATIVE]: [],
};

export class PropositionsService {
  config: ApiConfig;
  propositionValidator: PropositionValidator;
  actionsService: ActionsService;
  authService: AuthService;
  propositionTagsService: PropositionTagsService;
  propositionTagVotesService: PropositionTagVotesService;
  tagsService: TagsService;
  propositionsDao: PropositionsDao;
  permissionsDao: PermissionsDao;
  justificationsDao: JustificationsDao;

  constructor(
    config: ApiConfig,
    propositionValidator: PropositionValidator,
    actionsService: ActionsService,
    authService: AuthService,
    propositionTagsService: PropositionTagsService,
    propositionTagVotesService: PropositionTagVotesService,
    tagsService: TagsService,
    propositionsDao: PropositionsDao,
    permissionsDao: PermissionsDao,
    justificationsDao: JustificationsDao
  ) {
    requireArgs({
      config,
      propositionValidator,
      actionsService,
      authService,
      propositionTagsService,
      propositionTagVotesService,
      tagsService,
      propositionsDao,
      permissionsDao,
      justificationsDao,
    });

    this.config = config;
    this.propositionValidator = propositionValidator;
    this.actionsService = actionsService;
    this.authService = authService;
    this.propositionTagsService = propositionTagsService;
    this.propositionTagVotesService = propositionTagVotesService;
    this.tagsService = tagsService;
    this.propositionsDao = propositionsDao;
    this.permissionsDao = permissionsDao;
    this.justificationsDao = justificationsDao;
  }

  async readPropositionForId(
    propositionId: EntityId,
    { userId: userIdIn, authToken }: { userId: EntityId; authToken: AuthToken }
  ) {
    const userId =
      userIdIn ||
      (authToken && this.authService.readOptionalUserIdForAuthToken(authToken));
    const [proposition, propositionTags, recommendedTags, votes] =
      await Promise.all([
        this.propositionsDao.readPropositionForId(propositionId),
        this.propositionTagsService.readTagsForPropositionId(propositionId),
        this.propositionTagsService.readRecommendedTagsForPropositionId(
          propositionId
        ),
        userId &&
          this.propositionTagVotesService.readVotesForPropositionIdAsUser(
            userId,
            propositionId
          ),
      ]);
    if (!proposition) {
      throw new EntityNotFoundError(EntityTypes.PROPOSITION, propositionId);
    }
    // Ensure recommended tags also appear in full tags
    const tags = unionBy(propositionTags, recommendedTags, (tag) => tag.id);
    // Include only votes for present tags
    const propositionTagVotes = votes
      ? filter(votes, (vote) => some(tags, (tag) => tagEqual(tag, vote.tag)))
      : [];
    return { ...proposition, tags, recommendedTags, propositionTagVotes };
  }

  async readPropositions({
    sorts = [] as SortDescription[],
    continuationToken = undefined as ContinuationToken | undefined,
    count = 25,
  }) {
    const countNumber = toNumber(count);
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(
        `count must be a number. ${count} is not a number.`
      );
    }

    if (!continuationToken) {
      return await this.readInitialPropositions(sorts, countNumber);
    }
    return await this.readMorePropositions(continuationToken, countNumber);
  }

  async readPropositionsForIds(propositionsIds: EntityId[]) {
    return await this.propositionsDao.readPropositionsForIds(propositionsIds);
  }

  async readInitialPropositions(
    requestedSorts: SortDescription[],
    count: number
  ) {
    const disambiguationSorts = [
      { property: "id", direction: SortDirections.ASCENDING },
    ];
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts);
    const propositions = await this.propositionsDao.readPropositions(
      unambiguousSorts,
      count
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
    continuationToken: ContinuationToken,
    count: number
  ) {
    const { sorts, filters } = decodeContinuationToken(continuationToken);
    const propositions = await this.propositionsDao.readMorePropositions(
      sorts,
      count
    );
    const nextContinuationToken =
      createNextContinuationToken(sorts, propositions, filters) ||
      continuationToken;
    return {
      propositions,
      continuationToken: nextContinuationToken,
    };
  }

  async updateProposition(authToken: AuthToken, proposition: Proposition) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const validationErrors = this.propositionValidator.validate(proposition);
    if (validationErrors.hasErrors) {
      throw new EntityValidationError({ proposition: validationErrors });
    }
    const [equivalentPropositionsCount, userActionConflicts, hasPermission] =
      await Promise.all([
        this.propositionsDao.countEquivalentPropositions(proposition),
        Promise.props({
          [userActionsConflictCodes.OTHER_USERS_HAVE_ROOTED_JUSTIFICATIONS_IN_THIS_PROPOSITION]:
            this.propositionsDao.hasOtherUsersRootedJustifications(
              proposition,
              userId
            ),
          [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_PROPOSITION]:
            this.propositionsDao.hasOtherUsersRootedJustificationsVotes(
              proposition,
              userId
            ),
          [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_PROPOSITION]:
            this.propositionsDao.isBasisToOtherUsersJustifications(
              proposition,
              userId
            ),
        }),
        this.permissionsDao.userHasPermission(
          userId,
          permissions.EDIT_ANY_ENTITY
        ),
      ]);

    if (equivalentPropositionsCount > 0) {
      throw new EntityConflictError(
        merge(PropositionValidator.blankErrors(), {
          hasErrors: true,
          fieldErrors: {
            text: [entityConflictCodes.ANOTHER_PROPOSITION_HAS_EQUIVALENT_TEXT],
          },
        })
      );
    } else if (!hasPermission) {
      const userActionConflictCodes = keys(pickBy(userActionConflicts));
      if (userActionConflictCodes.length > 0) {
        throw new UserActionsConflictError(
          merge(PropositionValidator.blankErrors(), {
            hasErrors: true,
            modelErrors: userActionConflictCodes,
          })
        );
      }
    }

    const now = new Date();
    const updatedProposition = await this.propositionsDao.updateProposition(
      proposition
    );
    if (!updatedProposition) {
      throw new EntityNotFoundError(EntityTypes.PROPOSITION, proposition.id);
    }

    this.actionsService.asyncRecordAction(
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

    const now = new Date();

    if (!proposition) {
      throw new EntityNotFoundError(EntityTypes.PROPOSITION, propositionId);
    }

    if (!hasPermission) {
      const creatorUserId = get(proposition, "creator.id");
      if (!creatorUserId || userId !== creatorUserId) {
        throw new AuthorizationError({
          modelErrors: [
            authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES,
          ],
        });
      }
    }

    const created = moment(proposition.created);
    const graceCutoff = created.clone();
    graceCutoff.add(this.config.modifyEntityGracePeriod);
    const nowMoment = moment(now);
    if (nowMoment.isAfter(graceCutoff)) {
      throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod);
    }

    const otherUsersJustificationsDependentUponProposition = filter(
      dependentJustifications,
      (j) => get(j, "creator.id") !== userId
    );
    if (otherUsersJustificationsDependentUponProposition.length > 0) {
      throw new UserActionsConflictError();
    }

    const [deletedPropositionId, deletedJustificationIds] = await Promise.all([
      this.propositionsDao.deleteProposition(proposition, now),
      this.justificationsDao.deleteJustifications(dependentJustifications, now),
    ]);

    this.actionsService.asyncRecordAction(
      userId,
      now,
      ActionTypes.DELETE,
      ActionTargetTypes.PROPOSITION,
      deletedPropositionId
    );
    map(deletedJustificationIds, (id) =>
      this.actionsService.asyncRecordAction(
        userId,
        now,
        ActionTypes.DELETE,
        ActionTargetTypes.JUSTIFICATION,
        id
      )
    );

    return {
      deletedPropositionId,
      deletedJustificationIds,
    };
  }

  async readOrCreateProposition(
    authToken: AuthToken,
    proposition: CreateProposition
  ) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const now = new Date();
    return await this.readOrCreatePropositionAsUser(proposition, userId, now);
  }

  async readOrCreatePropositionAsUser(
    proposition: CreateProposition,
    userId: EntityId,
    now: Date
  ) {
    const validationErrors = this.propositionValidator.validate(proposition);
    if (validationErrors.hasErrors) {
      throw new EntityValidationError(validationErrors);
    }
    return await this.readOrCreateValidPropositionAsUser(
      proposition,
      userId,
      now
    );
  }

  async readOrCreateValidPropositionAsUser(
    createProposition: CreateProposition,
    userId: EntityId,
    now: Date
  ) {
    const { isExtant, proposition } = createProposition.id
      ? {
          isExtant: true,
          proposition: await this.readPropositionForId(createProposition.id, {
            userId,
          }),
        }
      : await this.readOrCreateEquivalentValidPropositionAsUser(
          createProposition,
          userId,
          now
        );

    if (proposition.tags) {
      // When creating a proposition, assume all tags are also votes.
      // (Anti-votes don't make any sense, because anti-votes are votes against tags recommended by the system
      //  based upon other users' activity.  But new propositions don't have other user activity, and so have no
      //  recommended tags against which to vote)
      const [tags, propositionTagVotes] = await this.readOrCreateTagsAndVotes(
        userId,
        proposition.id,
        proposition.tags,
        now
      );

      proposition.tags = tags;
      proposition.propositionTagVotes = propositionTagVotes;
    }

    return { isExtant, proposition };
  }

  async readPropositionsForTagId(
    tagId: EntityId,
    {
      userId: userIdIn = undefined,
      authToken,
    }: { userId?: EntityId; authToken: AuthToken }
  ) {
    const userId =
      userIdIn ||
      (await this.authService.readOptionalUserIdForAuthToken(authToken));

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
      [PropositionTagVotePolarities.POSITIVE]: taggedPositivePropositions,
      [PropositionTagVotePolarities.NEGATIVE]: taggedNegativePropositions,
    } = userTaggedPropositionsByVotePolarity;

    const taggedNegativePropositionIds = reduce(
      taggedNegativePropositions,
      (acc, s, id) => {
        acc[id] = true;
      },
      {}
    );
    const prunedRecommendedPropositions = reject(
      recommendedPropositions,
      (rs) => has(taggedNegativePropositionIds, rs.id)
    );
    const propositions = unionBy(
      taggedPositivePropositions,
      prunedRecommendedPropositions,
      (s) => s.id
    );

    return propositions;
  }

  private async readOrCreateEquivalentValidPropositionAsUser(
    createProposition: CreateProposition,
    userId: EntityId,
    now: Date
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
    this.actionsService.asyncRecordAction(
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

  private async readOrCreateTagsAndVotes(
    userId: EntityId,
    propositionId: EntityId,
    tags: CreateTag[],
    now: Date
  ) {
    const tagAndVotes = await Promise.all(
      map(tags, async (createTag) => {
        const tag = await this.tagsService.readOrCreateValidTagAsUser(
          userId,
          createTag,
          now
        );

        const propositionTagVote = makePropositionTagVote({
          proposition: { id: propositionId },
          tag,
          polarity: PropositionTagVotePolarities.POSITIVE,
        });
        return [
          tag,
          await this.propositionTagVotesService.readOrCreatePropositionTagVoteAsUser(
            userId,
            propositionTagVote,
            now
          ),
        ];
      })
    );
    // Split the tags and votes
    return unzip(tagAndVotes);
  }
}
