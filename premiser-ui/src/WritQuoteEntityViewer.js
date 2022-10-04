import React, {Component} from 'react'
import PropTypes from 'prop-types'

import EntityViewer from './EntityViewer'
import EditableWritQuote from './EditableWritQuote'

export default class WritQuoteEntityViewer extends Component {
  render() {
    const {
      id,
      writQuote,
      editorId,
      suggestionsKey,
      doShowControls,
      showUrls,
      showStatusText,
      onClickUrl,
      menu,
      ...rest
    } = this.props
    return (
      <EntityViewer
        iconName="format_quote"
        iconTitle="Writ quote"
        menu={menu}
        entity={
          <EditableWritQuote
            {...rest}
            id={id}
            writQuote={writQuote}
            editorId={editorId}
            suggestionsKey={suggestionsKey}
            doShowControls={doShowControls}
            showUrls={showUrls}
            showStatusText={showStatusText}
            onClickUrl={onClickUrl}
          />
        }
      />
    )
  }
}
WritQuoteEntityViewer.propTypes = {
  id: PropTypes.string.isRequired,
  writQuote: PropTypes.object.isRequired,
  editorId: PropTypes.string,
  suggestionsKey: PropTypes.string,
  doShowControls: PropTypes.bool,
  showStatusText: PropTypes.bool,
}
WritQuoteEntityViewer.defaultProps = {
  doShowControls: true,
}
