import React, { useEffect } from 'react'
import Helmet from '../../Helmet'
import get from 'lodash/get'
import map from 'lodash/map'
import {CircularProgress} from 'react-md'

import {
  api,
} from "../../actions"
import PropositionCard from '../../PropositionCard'
import {denormalize} from 'normalizr'
import {propositionsSchema, tagSchema} from '../../normalizationSchemas'
import * as characters from '../../characters'
import { EntityId } from 'howdju-common'
import { RouteComponentProps } from 'react-router'
import { useAppDispatch, useAppSelector } from '@/hooks'


interface MatchParams {
  tagId: EntityId;
}
type Props = RouteComponentProps<MatchParams>

export default function TagPage(props: Props) {

  const dispatch = useAppDispatch()
  const tagId = props.match.params.tagId
  useEffect(() => {
    dispatch(api.fetchTag(tagId))
    dispatch(api.fetchTaggedPropositions(tagId))
  }, [dispatch, tagId])

  const entities = useAppSelector(state => state.entities)
  const tag = denormalize(tagId, tagSchema, entities)
  const {propositions: propositionIds, isFetching} = useAppSelector(state => state.tagPage)
  const propositions = denormalize(propositionIds, propositionsSchema, entities)

  const tagName = get(tag, 'name', characters.ellipsis)
  const title = `Propositions tagged with ${characters.leftDoubleQuote}${tagName}${characters.rightDoubleQuote}`

  return (
    <div id="tag-page" className="md-grid">
      <Helmet>
        <title>{title} — Howdju</title>
      </Helmet>
      <div className="md-cell--12">
        <h1>{title}</h1>
      </div>
      {map(propositions, proposition => {
        const id = `proposition-card-${proposition.id}`
        return (
          <PropositionCard
            proposition={proposition}
            id={id}
            key={id}
            className="md-cell--12"
          />
        )
      })}
      {!isFetching && propositions.length < 1 && (
        <div className="md-cell--12">No tagged propositions</div>
      )}
      {isFetching && (
        <div className="md-cell md-cell--12 cell--centered-contents">
          <CircularProgress id="tagged-propositions-page--progress" />
        </div>
      )}
    </div>
  )
}
