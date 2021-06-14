import React from 'react'
import {
  Card,
  CardText,
} from 'react-md'

import {combineIds} from './viewModels'

export default function withEntityCard(EntityViewerComponent, entityPropName) {
  return class EntityCard extends React.Component {
    render() {
      const {
        id,
        editorId,
        menu,
        suggestionsKey,
        ...rest
      } = this.props

      return (
        <Card className="entity-card" {...rest}>
          <CardText className="entity-card-contents">
            <EntityViewerComponent
              id={combineIds(id, 'entity-viewer')}
              {...{[entityPropName]: this.props[entityPropName]}}
              editorId={editorId}
              suggestionsKey={suggestionsKey}
              menu={menu}
            />
          </CardText>
        </Card>
      )
    }
  }
}
