import React, { Component } from 'react'
import cx from 'classnames'
import { css } from 'glamor'
import { node, object, string, number, func } from 'prop-types'

const dragClass = css({
  // position: 'fixed',
  top: 0,
  left: 0,
  width: '2px',
  backgroundColor: 'black',
  height: '100%',
  cursor: 'ew-resize',
})

const containerVisibleClass = css({
  transform: 'translate3d(0,0,0)'
})

const containerMinimizedClass = css({
  cursor: 'pointer',
  transform: 'translateX(94%)',
  ':hover': {
    transform: 'translateX(92%)'
  },
  '& > iframe': {
    pointerEvents: 'none'
  }
})

const FRAME_TOGGLE_FUNCTION = 'chromeIframeSheetToggle'

export class FramePanel extends Component {
  render() {
    const {
      isVisible,
      isMinimized,
      containerWidth,
      isDragging,
    } = this.state
    const {
      url,
      className,
      containerClassName,
      containerStyle,
      iframeClassName,
      iframeStyle,
      children,
      containerChildren,
      minimumContainerWidth,
    } = this.props

    const containerClass = css({
      position: 'fixed',
      top: '0px',
      right: '0px',
      height: '100%',
      width: '65%',
      maxWidth: containerWidth + 'px',
      minWidth: minimumContainerWidth + 'px',
      padding: '8px',
      boxSizing: 'border-box',
      transform: 'translateX(100%)',
      transition: 'transform .45s cubic-bezier(0, 0, 0.3, 1)',
      zIndex: 10000,
      display: 'flex',
      flexFlow: 'row nowrap',
    })

    const iframeClass = css({
      border: 'none',
      width: '100%',
      height: '100%',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '-1px 1px 8px rgba(0,0,0,.15)',
      pointerEvents: isDragging ? 'none' : 'auto'
    })

    return (
      <div>
        <div
          className={cx({
            [containerClass]: true,
            [containerVisibleClass]: isVisible,
            [containerMinimizedClass]: isMinimized,
            [containerClassName]: true
          })}
          style={containerStyle}
          onClick={this.onFramePanelClick}
        >
          <div
            className={cx({
              [dragClass]: true,
            })}
            onMouseDown={this.onDragMouseDown}
            ref={drag => this.drag = drag}
          />
          <iframe
            className={cx({
              [iframeClass]: true,
              [iframeClassName]: true
            })}
            style={iframeStyle}
            src={url}
            ref={frame => this.frame = frame}
            onLoad={this.onLoad}
          />

          {containerChildren}
        </div>

        {children}
      </div>
    )
  }

  static defaultProps = {
    url: '',
    initialContainerWidth: 400,
    minimumContainerWidth: 200,
    delay: 500,
    maskClassName: '',
    maskStyle: {},
    containerClassName: '',
    containerStyle: {},
    iframeClassName: '',
    iframeStyle: {},
    onMount: () => {},
    onUnmount: () => {},
    onLoad: () => {}
  }

  state = {
    isVisible: false,
    isMinimized: false,
    isDragging: false,
    containerWidth: FramePanel.defaultProps.initialContainerWidth,
  }

  static propTypes = {
    url: string,
    delay: number,
    maskClassName: string,
    maskStyle: object,
    containerClassName: string,
    containerStyle: object,
    iframeClassName: string,
    iframeStyle: object,
    children: node,
    containerChildren: node,
    onMount: func,
    onUnmount: func,
    onLoad: func
  }

  componentDidMount() {
    const { delay, onMount, initialContainerWidth } = this.props

    window[FRAME_TOGGLE_FUNCTION] = this.toggleFrame

    onMount({
      frame: this.frame
    })

    this._visibleRenderTimeout = setTimeout(() => {
      this.setState({
        isVisible: true,
        containerWidth: initialContainerWidth,
        isDragging: false,
      })
    }, delay)
  }

  componentWillUnmount() {
    const { onUnmount } = this.props

    onUnmount({
      frame: this.frame
    })

    delete window[FRAME_TOGGLE_FUNCTION]
    clearTimeout(this._visibleRenderTimeout)
  }

  onLoad = () => {
    const { onLoad } = this.props

    onLoad({
      frame: this.frame
    })
  }

  onDragMouseDown = (e) => {
    e = e || window.event
    e.preventDefault()
    // get the mouse cursor position at startup:
    this.setState({
      dragX: e.clientX,
      isDragging: true,
    })
    document.onmouseup = this.onEndDrag
    document.onmousemove = this.onDrag
  }

  onDrag = (e) => {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position:
    const deltaX = this.state.dragX - e.clientX
    this.setState({
      dragX: e.clientX,
      // Since the container comes from the right, it's width is inversely correlated with the x-axis. So subtract.
      containerWidth: this.state.containerWidth + deltaX
    })
  }

  onEndDrag = (e) => {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
    this.setState({
      isDragging: false,
    })
  }

  onFramePanelClick = () => {
    this.setState({
      isMinimized: false
    })
  }

  toggleFrame = () => {
    this.setState({
      isMinimized: !this.state.isMinimized
    })
  }

  static isReady() {
    return typeof window[FRAME_TOGGLE_FUNCTION] !== 'undefined'
  }

  static toggle() {
    if (window[FRAME_TOGGLE_FUNCTION]) {
      window[FRAME_TOGGLE_FUNCTION]()
    }
  }
}

export default FramePanel
