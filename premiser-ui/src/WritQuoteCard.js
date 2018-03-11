import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {Card, CardText} from 'react-md'
import cn from 'classnames'

import ExpandableChildContainer from './ExpandableChildContainer'
import WritQuoteEntityViewer from './WritQuoteEntityViewer'

import './WritQuoteCard.scss'

export default class WritQuoteCard extends Component {

  render () {
    const {
      id,
      writQuote,
      className,
      showUrls,
      ...rest,
    } = this.props

    return (
      <Card {...rest}
            className={cn(className, "entity-card")}
      >
        <CardText>
          <ExpandableChildContainer
            {...rest}
            id={id}
            expandableChildComponent={WritQuoteEntityViewer}
            writQuote={writQuote}
            showUrls={showUrls}
          />
        </CardText>
      </Card>
    )
  }
}
WritQuoteCard.propTypes = {
  writQuote: PropTypes.object.isRequired,
}
WritQuoteCard.defaultProps = {
  showUrls: false,
}