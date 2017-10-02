import React, {Component}  from 'react'
import {Link} from 'react-router-dom'
import FontIcon from 'react-md/lib/FontIcons/FontIcon'

import {
  makeNewStatement,
  makeNewSourceExcerptParaphrase,
  makeNewJustification,
  SourceExcerptType,
  JustificationBasisType,
  JustificationTargetType,
  makeNewJustificationBasisCompound,
  makeNewJustificationBasisCompoundAtom,
  JustificationBasisCompoundAtomType,
  JustificationPolarity,
  JustificationRootPolarity,
} from 'howdju-common'

import paths from './paths'
import StatementCard from './StatementCard'
import JustificationChatBubble from './JustificationChatBubble'

import './LandingPage.scss'


export default class LandingPage extends Component {
  render() {
    const id = 'landing-page'
    const statement = makeNewStatement({text: 'A very important statement'})
    const sourceExcerptParaphrase = makeNewSourceExcerptParaphrase({
      paraphrasingStatement: {text: 'A paraphrase'},
      sourceExcerpt: {
        type: SourceExcerptType.WRIT_QUOTE,
        entity: {
          writ: {title: 'The title'},
          quoteText: 'A quote here'
        }
      }
    })
    const justification = makeNewJustification({
      rootStatement: statement,
      basis: {
        type: JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
        entity: makeNewJustificationBasisCompound({
          atoms: [{
            type: JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
            entity: makeNewJustificationBasisCompoundAtom(sourceExcerptParaphrase)
          }]
        })
      },
      target: {
        type: JustificationTargetType.STATEMENT,
        entity: statement,
      }
    })
    const contraJustification = makeNewJustification({
      ...justification,
      polarity: JustificationPolarity.NEGATIVE,
      rootPolarity: JustificationRootPolarity.NEGATIVE,
    })

    const counterJustification = makeNewJustification({
      ...justification,
      target: {
        type: JustificationTargetType.JUSTIFICATION,
        entity: contraJustification,
      }
    })

    return (
      <div id={id} className="app-page">
        <p className="primary-slogan">
          Discover and share truth on Howdju.
        </p>
        <p>
          How do you capture truth?  First you make a statement:
        </p>

        <div className="banner">
          <div className="banner-content">
            <StatementCard
              id={`${id}--statement`}
              statement={statement}
              showStatusText={false}
            />
          </div>
        </div>

        <p>
          A statement on its own is just an opinion.  To become truth, a statement must have good justifications.
        </p>

        <div className="banner">
          <div className="banner-content">
            <StatementCard
              id={`${id}--justification--root-statement`}
              statement={justification.rootStatement}
              showStatusText={false}
            />
            <JustificationChatBubble
              justification={justification}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
            />
          </div>
        </div>

        <p>
          Justifications can either support or oppose the truth of a statement.
        </p>

        <div className="banner">
          <div className="banner-content">
            <StatementCard
              id={`${id}--justification--root-statement`}
              statement={justification.rootStatement}
              showStatusText={false}
            />
            <JustificationChatBubble
              justification={contraJustification}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
            />
          </div>
        </div>

        <p>
          Justifications can also counter other justifications.
        </p>

        <div className="banner">
          <div className="banner-content">
            <StatementCard
              id={`${id}--justification--root-statement`}
              statement={justification.rootStatement}
              showStatusText={false}
            />
            <JustificationChatBubble
              id={`target-justification-${justification.target.entity.id}`}
              justification={counterJustification.target.entity}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
            />
            <JustificationChatBubble
              justification={counterJustification}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
            />
          </div>
        </div>

        <p>
          Howdju&rsquo;s hypothesis is that misunderstanding and misinformation persist when not enough people have the
          tools to evaluate truth in a way that is 1) <strong>efficient</strong>, and
          2) designed to accommodate <strong>alternate viewpoints</strong>.
        </p>
        <p>
          Howdju&rsquo;s goal is to provide those tools, with your help.
        </p>

        <p>
          Some ways to use Howdju:
        </p>
        <ul id="ways-to-use" className="blocks">
          <li className="block-item-spacer">
            <div className="icon">
              <FontIcon>book</FontIcon>
            </div>
            Organize research: capture the implications of the primary sources you discover, making them available
            to others while benefiting from the contributions of others.
          </li>
          <li className="block-item-spacer">
            <div className="icon">
              <FontIcon>share</FontIcon>
            </div>
            Share justifications with colleagues or friends to empower informed dialog and to clarify viewpoints.
          </li>
          <li className="block-item-spacer">
            <div className="icon">
              <FontIcon>whatshot</FontIcon>
            </div>
            Discover the best information about interesting and relevant topics.
          </li>
        </ul>

        <p>
          How to get started:
        </p>
        <ul id="get-started" className="blocks">
          <li>
            <Link to={paths.tools()}>
              <div className="block-item-spacer">
                Install the bookmarklet to become an info hero
              </div>
            </Link>
          </li>
          <li>
            <Link to={paths.recentActivity()}>
              <div className="block-item-spacer">
                Browse Howdju&rsquo;s content
              </div>
            </Link>
          </li>
          <li>
            <Link to={paths.about()}>
              <div className="block-item-spacer">
                Learn more about Howdju&rsquo;s features
              </div>
            </Link>
          </li>
        </ul>
      </div>
    )
  }
}
