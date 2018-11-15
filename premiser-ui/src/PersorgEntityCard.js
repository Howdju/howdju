import React from 'react'
import {
  Card,
  CardText,
} from 'react-md'

import PersorgEntityViewer from './PersorgEntityViewer'
import {combineIds} from './viewModels'

export default class PersorgEntityCard extends React.Component {
  render() {
    const {
      id,
      editorId,
      persorg,
      menu,
      suggestionKeys,
      ...rest
    } = this.props

    return (
      <Card
        className="'persorg-card'"
        {...rest}
      >
        <CardText className="proposition-card-contents">
          <PersorgEntityViewer
            id={combineIds(id, 'persorg-entity-viewer')}
            persorg={persorg}
            editorId={editorId}
            suggestionsKey={suggestionKeys}
            menu={menu}
          />
        </CardText>
      </Card>
    )
  }
}