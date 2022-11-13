import React, { Component } from 'react'
import cn from 'classnames'
import { css } from 'glamor'
import { node, object, string, number, func } from 'prop-types'

const dragTargetClass = css({
  top: 0,
  left: 0,
  width: '2px',
  backgroundColor: '#333',
  height: '100%',
  cursor: 'ew-resize',
})

// Can't be declared in the render method for some reason...it just goes eventually disappears and frame becomes invisible.
const containerVisibleClass = css({
  // must be declared !important to override containerClass which is declared after this and so can take priority
  transform: 'translate3d(0,0,0) !important',
})

// Must come after containerVisibleClass to take precedence
const containerMinimizedClass = css({
  cursor: 'pointer',
  transform: 'translateX(94%) !important',
  ':hover': {
    transform: 'translateX(92%) !important',
  },
  '& > iframe': {
    pointerEvents: 'none',
  },
})

const FRAME_TOGGLE_FUNCTION = 'howdjuFramePanelToggle'
const FRAME_SHOW_FUNCTION = 'howdjuFramePanelShow'

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
      pointerEvents: isDragging ? 'none' : 'auto',
    })

    return (
      <div className={className}>
        <div
          className={cn({
            [containerClass]: true,
            [containerVisibleClass]: isVisible,
            [containerMinimizedClass]: isMinimized,
            [containerClassName]: true,
          })}
          style={containerStyle}
          onClick={this.onFramePanelClick}
        >
          <div
            className={cn({
              [dragTargetClass]: true,
            })}
            onMouseDown={this.onDragTargetMouseDown}
            ref={drag => this.dragTarget = drag}
          />
          <iframe
            className={cn({
              [iframeClass]: true,
              [iframeClassName]: true,
            })}
            style={iframeStyle}
            ref={frame => this.frame = frame}
            onLoad={this.onLoad}
            src={url}
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
    onLoad: () => {},
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
    onLoad: func,
  }

  componentDidMount() {
    const { delay, onMount, initialContainerWidth } = this.props

    window[FRAME_TOGGLE_FUNCTION] = this.toggle
    window[FRAME_SHOW_FUNCTION] = this.show

    // Expose an API of methods
    onMount({
      toggle: this.toggle,
      show: this.show,
      postMessage: this.postMessage,
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
    delete window[FRAME_TOGGLE_FUNCTION]
    delete window[FRAME_SHOW_FUNCTION]
    clearTimeout(this._visibleRenderTimeout)
  }

  onLoad = () => {
    if (this.props.onLoad) {
      this.props.onLoad({
        frame: this.frame,
      })
    }
  }

  onDragTargetMouseDown = (e) => {
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
      containerWidth: this.state.containerWidth + deltaX,
    })
  }

  onEndDrag = (e) => {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null
    document.onmousemove = null
    this.setState({
      isDragging: false,
    })
  }

  onFramePanelClick = () => {
    this.setState({
      isMinimized: false,
    })
  }

  toggle = () => {
    this.setState({
      isMinimized: !this.state.isMinimized,
    })
  }

  show = (onShow) => {
    this.setState({
      isMinimized: false,
    })
  }

  postMessage = (message, origin) => {
    this.frame.contentWindow.postMessage(message, origin)
  }

  static isReady() {
    return typeof window[FRAME_TOGGLE_FUNCTION] !== 'undefined'
  }

  static toggle() {
    if (window[FRAME_TOGGLE_FUNCTION]) {
      window[FRAME_TOGGLE_FUNCTION]()
    }
  }

  static show(onShow) {
    if (window[FRAME_SHOW_FUNCTION]) {
      window[FRAME_SHOW_FUNCTION](onShow)
    }
  }
}

export default FramePanel
