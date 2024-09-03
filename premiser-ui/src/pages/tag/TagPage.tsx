import React, { useEffect } from "react";
import { get, map } from "lodash";
import { GridCell } from "@react-md/utils";

import { api, propositionsSchema, tagSchema } from "howdju-client-common";

import Helmet from "../../Helmet";
import PropositionCard from "../../PropositionCard";
import { denormalize } from "normalizr";
import * as characters from "../../characters";
import { EntityId } from "howdju-common";
import { RouteComponentProps } from "react-router";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { CircularProgress } from "@/components/progress/CircularProgress";
import { FlipGrid } from "@/components/layout/FlipGrid";
import { propositionCardColSpans } from "@/components/listEntities/ListEntitiesWidget";
import { Page } from "@/components/layout/Page";

interface MatchParams {
  tagId: EntityId;
}
type Props = RouteComponentProps<MatchParams>;

export default function TagPage(props: Props) {
  const dispatch = useAppDispatch();
  const tagId = props.match.params.tagId;
  useEffect(() => {
    dispatch(api.fetchTag(tagId));
    dispatch(api.fetchTaggedPropositions(tagId));
  }, [dispatch, tagId]);

  const entities = useAppSelector((state) => state.entities);
  const tag = denormalize(tagId, tagSchema, entities);
  const { propositions: propositionIds, isFetching } = useAppSelector(
    (state) => state.tagPage
  );
  const propositions = denormalize(
    propositionIds,
    propositionsSchema,
    entities
  );

  const tagName = get(tag, "name", characters.ellipsis);
  const title = `Propositions tagged with ${characters.leftDoubleQuote}${tagName}${characters.rightDoubleQuote}`;

  return (
    <Page id="tag-page">
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <h1>{title}</h1>
      <FlipGrid>
        {map(propositions, (proposition) => {
          const id = `proposition-card-${proposition.id}`;
          return (
            <GridCell key={id} {...propositionCardColSpans}>
              <PropositionCard proposition={proposition} id={id} />
            </GridCell>
          );
        })}
      </FlipGrid>
      {!isFetching && propositions.length < 1 && (
        <div>No tagged propositions</div>
      )}
      {isFetching && (
        <CircularProgress id="tagged-propositions-page--progress" />
      )}
    </Page>
  );
}
