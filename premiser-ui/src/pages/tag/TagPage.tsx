import React, { useEffect } from "react";
import Helmet from "../../Helmet";
import get from "lodash/get";
import map from "lodash/map";

import { api } from "../../actions";
import PropositionCard from "../../PropositionCard";
import { denormalize } from "normalizr";
import { propositionsSchema, tagSchema } from "../../normalizationSchemas";
import * as characters from "../../characters";
import { EntityId } from "howdju-common";
import { RouteComponentProps } from "react-router";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { CircularProgress } from "@/components/progress/CircularProgress";
import { Grid } from "@react-md/utils";

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
    <div id="tag-page">
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <h1>{title}</h1>
      <Grid clone={true} columns={4} phoneColumns={2}>
        {map(propositions, (proposition) => {
          const id = `proposition-card-${proposition.id}`;
          return <PropositionCard proposition={proposition} id={id} key={id} />;
        })}
      </Grid>
      {!isFetching && propositions.length < 1 && (
        <div>No tagged propositions</div>
      )}
      {isFetching && (
        <CircularProgress id="tagged-propositions-page--progress" />
      )}
    </div>
  );
}
