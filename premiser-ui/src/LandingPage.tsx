import React, { Component } from "react";
import { Link } from "react-router-dom";
import { FontIcon } from "react-md";
import cloneDeep from "lodash/cloneDeep";

import {
  JustificationBasisTypes,
  JustificationTargetTypes,
  JustificationPolarities,
  PropositionOut,
  PropositionRef,
  JustificationRef,
  PropositionCompoundRef,
  WritRef,
  WritQuoteRef,
  UrlRef,
  ContextTrailItem,
} from "howdju-common";
import { makeJustificationOutModel } from "howdju-client-common";

import paths from "./paths";
import PropositionCard from "./PropositionCard";
import JustificationChatBubble from "./JustificationChatBubble";
import JustificationBranch from "./JustificationBranch";
import { combineIds } from "./viewModels";

import "./LandingPage.scss";
import ContextTrail from "@/components/contextTrail/ContextTrail";
import moment from "moment";

export default class LandingPage extends Component {
  render() {
    const created = moment.utc("2017-01-12");
    const id = "landing-page";
    const rootProposition: PropositionOut = {
      ...PropositionRef.parse({ id: "example" }),
      text: "By law, no building in Washington, D.C. may be taller than the Capitol building",
      created,
    };
    const proJustificationProposition: PropositionOut = {
      ...PropositionRef.parse({ id: "example" }),
      text: "The 1899 Height of Buildings Act established that no building could be taller than the Capitol (289 feet)",
      created,
    };
    const proJustification = makeJustificationOutModel({
      ...JustificationRef.parse({ id: "example" }),
      polarity: "POSITIVE",
      target: {
        type: JustificationTargetTypes.PROPOSITION,
        entity: rootProposition,
      },
      basis: {
        type: JustificationBasisTypes.PROPOSITION_COMPOUND,
        entity: {
          ...PropositionCompoundRef.parse({ id: "example" }),
          atoms: [
            { compoundId: "example", entity: proJustificationProposition },
          ],
        },
      },
      created,
    });
    const proJustificationJustification = makeJustificationOutModel({
      ...JustificationRef.parse({ id: "example" }),
      created,
      target: {
        type: JustificationTargetTypes.PROPOSITION,
        entity: proJustificationProposition,
      },
      polarity: JustificationPolarities.POSITIVE,
      basis: {
        type: "WRIT_QUOTE",
        entity: {
          ...WritQuoteRef.parse({ id: "example" }),
          quoteText:
            "The Heights of Buildings Act of 1899 limited buildings in the District to 288 feet, the height of the Capitol building, in response to the newly erected 14-story Cairo apartment tower, then considered a monstrosity (now revered as outstandingly beautiful) towering over its Dupont Circle neighborhood.",
          writ: {
            ...WritRef.parse({ id: "example" }),
            title:
              "Vantage Point: The Curse of (Certain) Tall Buildings — The American Surveyor",
            created,
          },
          urls: [
            {
              ...UrlRef.parse({ id: "example" }),
              url: "https://archive.amerisurv.com/PDF/TheAmericanSurveyor_Lathrop-TallBuildings_January2009.pdf",
            },
          ],
          created,
        },
      },
    });

    const proTrailItems: ContextTrailItem[] = [
      {
        connectingEntity: proJustification,
        connectingEntityId: proJustification.id,
        connectingEntityType: "JUSTIFICATION",
        polarity: proJustification.polarity,
      },
      {
        connectingEntity: proJustificationJustification,
        connectingEntityId: proJustificationJustification.id,
        connectingEntityType: "JUSTIFICATION",
        polarity: proJustificationJustification.polarity,
      },
    ];

    const conJustificationProposition: PropositionOut = {
      ...PropositionRef.parse({ id: "example" }),
      text: "In general, buildings in Washington, D.C. may be no taller than the width of their adjacent street plus 20 feet ",
      created,
    };
    const conJustification = makeJustificationOutModel({
      ...JustificationRef.parse({ id: "example" }),
      created,
      target: {
        type: JustificationTargetTypes.PROPOSITION,
        entity: rootProposition,
      },
      polarity: JustificationPolarities.NEGATIVE,
      basis: {
        type: JustificationBasisTypes.PROPOSITION_COMPOUND,
        entity: {
          ...PropositionCompoundRef.parse({ id: "example" }),
          atoms: [
            {
              compoundId: "example",
              entity: conJustificationProposition,
            },
          ],
        },
      },
    });
    const conJustificationJustification = makeJustificationOutModel({
      ...JustificationRef.parse({ id: "example" }),
      created,
      polarity: JustificationPolarities.POSITIVE,
      target: {
        type: JustificationTargetTypes.PROPOSITION,
        entity: conJustificationProposition,
      },
      basis: {
        type: "WRIT_QUOTE",
        entity: {
          ...WritQuoteRef.parse({ id: "example" }),
          created,
          quoteText:
            "No building shall be erected, altered, or raised in the District of Columbia in any manner so as to exceed in height above the sidewalk the width of the street, avenue, or highway in its front, increased by 20 feet",
          writ: {
            ...WritRef.parse({ id: "example" }),
            created,
            title:
              "DC Code - § 6–601.05. Street width to control building height; business streets; residence streets; specified properties; structures above top story of building.",
          },
          urls: [
            {
              ...UrlRef.parse({ id: "example" }),
              url: "https://code.dccouncil.gov/us/dc/council/code/sections/6-601.05",
            },
          ],
        },
      },
    });

    const conTrailItems: ContextTrailItem[] = [
      {
        connectingEntity: conJustification,
        connectingEntityId: conJustification.id,
        connectingEntityType: "JUSTIFICATION",
        polarity: conJustification.polarity,
      },
      {
        connectingEntity: conJustificationJustification,
        connectingEntityId: conJustificationJustification.id,
        connectingEntityType: "JUSTIFICATION",
        polarity: conJustificationJustification.polarity,
      },
    ];

    const counterJustification = makeJustificationOutModel({
      ...JustificationRef.parse({ id: "example" }),
      created,
      polarity: "NEGATIVE",
      target: {
        type: "JUSTIFICATION",
        entity: proJustification,
      },
      basis: {
        type: JustificationBasisTypes.PROPOSITION_COMPOUND,
        entity: {
          ...PropositionCompoundRef.parse({ id: "example" }),
          atoms: [
            {
              compoundId: "example",
              entity: {
                ...PropositionRef.parse({ id: "example" }),
                created,
                text: "The 1910 Height of Buildings Act amended the 1899 act to base the height restriction on the width of adjacent streets.",
              },
            },
          ],
        },
      },
    });
    const proJustificationCountered = cloneDeep(proJustification);
    proJustificationCountered.counterJustifications = [counterJustification];

    return (
      <div id={id} className="app-page">
        <p className="primary-slogan">Discover and share truth on Howdju.</p>
        <p>How does one represent truth? With justified propositions.</p>

        <div className="banner">
          <div className="banner-content">
            <PropositionCard
              id={combineIds(id, "proposition-example", "proposition")}
              proposition={rootProposition}
              showStatusText={false}
            />
          </div>
        </div>

        <p>
          A proposition on its own is just an opinion. To become truth, a
          proposition must have good justifications.
        </p>

        <div className="banner">
          <div className="banner-content">
            <PropositionCard
              id={combineIds(
                id,
                "justified-proposition-example",
                "proposition"
              )}
              proposition={rootProposition}
              showStatusText={false}
            />
            <JustificationChatBubble
              justification={proJustification}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
              showBasisUrls={false}
            />
          </div>
        </div>

        <p>
          Justifications can either support or oppose the truth of a
          proposition.
        </p>

        <div className="banner">
          <div className="banner-content">
            <PropositionCard
              id={combineIds(
                id,
                "opposing-justification-example",
                "proposition"
              )}
              proposition={rootProposition}
              showStatusText={false}
            />
            <JustificationChatBubble
              justification={conJustification}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
              showBasisUrls={false}
            />
          </div>
        </div>

        <p>Good justifications have evidence.</p>

        <div className="banner">
          <div className="banner-content">
            <ContextTrail id="pro-context-trail" trailItems={proTrailItems} />
            <JustificationBranch
              justification={proJustificationJustification}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
              showBasisUrls={true}
            />
          </div>
        </div>

        <p>Better evidence makes a better justification</p>

        <div className="banner">
          <div className="banner-content">
            <ContextTrail id="con-context-trail" trailItems={conTrailItems} />
            <JustificationBranch
              justification={conJustificationJustification}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
              showBasisUrls={true}
            />
          </div>
        </div>

        <p>Justifications can also counter other justifications.</p>

        <div className="banner">
          <div className="banner-content">
            <PropositionCard
              id={combineIds(
                id,
                "counter-justification-example",
                "proposition"
              )}
              proposition={rootProposition}
              showStatusText={false}
            />
            <JustificationBranch
              id={`target-justification-${proJustificationCountered.id}`}
              justification={proJustificationCountered}
              doShowBasisJustifications={false}
              doShowControls={false}
              showStatusText={false}
              showBasisUrls={false}
            />
          </div>
        </div>

        <p>
          Howdju&rsquo;s hypothesis is that misunderstanding and misinformation
          persist when not enough people have the tools to evaluate truth in a
          way that is 1) <strong>efficient</strong>, and 2) designed to
          accommodate <strong>alternate viewpoints</strong>.
        </p>
        <p>Howdju&rsquo;s goal is to provide those tools, with your help.</p>

        <p>Some ways to use Howdju:</p>
        <ul id="ways-to-use" className="blocks">
          <li className="block-item-spacer">
            <div className="icon">
              <FontIcon>book</FontIcon>
            </div>
            Organize research: capture the implications of the primary sources
            you discover, making them available to others while benefiting from
            the contributions of others.
          </li>
          <li className="block-item-spacer">
            <div className="icon">
              <FontIcon>share</FontIcon>
            </div>
            Share justifications with colleagues or friends to empower informed
            dialog and to clarify viewpoints.
          </li>
          <li className="block-item-spacer">
            <div className="icon">
              <FontIcon>whatshot</FontIcon>
            </div>
            Discover the best information about interesting and relevant topics.
          </li>
        </ul>

        <p>How to get started:</p>
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
    );
  }
}
