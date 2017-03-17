import React, { Component, PropTypes } from 'react'

class UiContainer extends Component {
  render () {
    return (
        <div className="statement-justifications">
          <div className="statement">
            The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act
          </div>
          <div className="justifications">
            <div className="justification positive">
              The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026
            </div>
            <div className="justification negative">
              The AHCA will uninsure 14 million people by 2018
            </div>
            <div className="justification positive">
              The AHCA is shorter than the ACA
            </div>
            <div className="justification positive">
              The AHCA removes the penalty for choosing not to have health insurance
            </div>
            <div className="justification negative">
              The removal of the individual mandate will drive up insurance costs and emergency care costs
            </div>
          </div>
        </div>
    )
  }
}

export default UiContainer
