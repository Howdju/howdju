import { FontIcon } from "@react-md/icon";
import cloneDeep from "lodash/cloneDeep";
import moment from "moment";
import React, { Component } from "react";
import { Link } from "react-router-dom";

import { makeJustificationViewModel } from "howdju-client-common";
import {
  brandedParse,
  ContextTrailItem,
  JustificationBasisTypes,
  JustificationPolarities,
  JustificationRef,
  JustificationTargetTypes,
  MediaExcerptRef,
  MediaExcerptView,
  PropositionCompoundRef,
  PropositionOut,
  PropositionRef,
  UrlRef
} from "howdju-common";

import ContextTrail from "@/components/contextTrail/ContextTrail";
import MediaExcerptCard from "@/components/mediaExcerpts/MediaExcerptCard";
import TreePolarity from "@/components/TreePolarity";
import JustificationBranch from "@/JustificationBranch";
import paths from "@/paths";
import PropositionCard from "@/PropositionCard";
import { combineIds } from "@/viewModels";

import "./LandingPage.scss";

export default class LandingPage extends Component {
  render() {
    const created = moment.utc("2017-01-12");
    const id = "landing-page";
    const rootProposition: PropositionOut = {
      ...PropositionRef.parse({ id: "1416" }),
      text: "By law, no building in Washington, D.C. may be taller than the Capitol building",
      normalText:
        "By law, no building in Washington, D.C. may be taller than the Capitol building",
      created,
    };
    const proJustificationProposition: PropositionOut = {
      ...PropositionRef.parse({ id: "1421" }),
      text: "The 1899 Height of Buildings Act established that no building could be taller than the Capitol (289 feet)",
      normalText:
        "The 1899 Height of Buildings Act established that no building could be taller than the Capitol (289 feet)",
      created,
    };
    const proJustification = makeJustificationViewModel({
      ...JustificationRef.parse({ id: "2573" }),
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
            {
              propositionCompoundId: "example",
              entity: proJustificationProposition,
            },
          ],
        },
      },
      created,
    });
    const creator = { id: "example-user", longName: "The Creator" };
    const creatorUserId = "example";
    const proMediaExcerpt: MediaExcerptView = {
      ...MediaExcerptRef.parse({ id: "1976" }),
      localRep: {
        quotation:
          "The Heights of Buildings Act of 1899 limited buildings in the District to 288 feet, the height of the Capitol building, in response to the newly erected 14-story Cairo apartment tower, then considered a monstrosity (now revered as outstandingly beautiful) towering over its Dupont Circle neighborhood.",
        normalQuotation:
          "The Heights of Buildings Act of 1899 limited buildings in the District to 288 feet, the height of the Capitol building, in response to the newly erected 14-story Cairo apartment tower, then considered a monstrosity (now revered as outstandingly beautiful) towering over its Dupont Circle neighborhood.",
      },
      speakers: [],
      creator,
      locators: {
        urlLocators: [
          {
            id,
            creatorUserId,
            key: "url-locator-original",
            autoConfirmationStatus: {
              status: "PREVIOUSLY_FOUND",
              earliestFoundAt: moment(),
              latestFoundAt: moment(),
              earliestNotFoundAt: moment(),
              latestNotFoundAt: moment(),
              foundQuotation:
                "The Heights of Buildings Act of 1899 limited buildings in the District to 288 feet, the height of the Capitol building, in response to the newly erected 14-story Cairo apartment tower, then considered a monstrosity (now revered as outstandingly beautiful) towering over its Dupont Circle neighborhood.",
            },
            created,
            creator,
            mediaExcerptId: "1436",
            url: brandedParse(UrlRef, {
              id: "example",
              url: "https://archive.amerisurv.com/PDF/TheAmericanSurveyor_Lathrop-TallBuildings_January2009.pdf",
              canonicalUrl:
                "https://archive.amerisurv.com/PDF/TheAmericanSurveyor_Lathrop-TallBuildings_January2009.pdf",
            }),
          },
          {
            id,
            creatorUserId,
            key: "url-locator-archive",
            autoConfirmationStatus: {
              status: "FOUND",
              earliestFoundAt: moment(),
              latestFoundAt: moment(),
              foundQuotation:
                "The Heights of Buildings Act of 1899 limited buildings in the District to 288 feet, the height of the Capitol building, in response to the newly erected 14-story Cairo apartment tower, then considered a monstrosity (now revered as outstandingly beautiful) towering over its Dupont Circle neighborhood.",
            },
            created,
            creator,
            mediaExcerptId: "1436",
            url: brandedParse(UrlRef, {
              id: "example",
              url: "https://web.archive.org/web/20210512170410/https://archive.amerisurv.com/PDF/TheAmericanSurveyor_Lathrop-TallBuildings_January2009.pdf",
              canonicalUrl:
                "https://web.archive.org/web/20210512170410/https://archive.amerisurv.com/PDF/TheAmericanSurveyor_Lathrop-TallBuildings_January2009.pdf",
            }),
          },
        ],
      },
      citations: [
        {
          created,
          mediaExcerptId: "1436",
          creatorUserId,
          key: "citation-example",
          source: {
            id: "example",
            creator,
            creatorUserId: "example",
            description:
              "“Vantage Point: The Curse of (Certain) Tall Buildings” — The American Surveyor (January 2009)",
            normalDescription:
              "“Vantage Point: The Curse of (Certain) Tall Buildings” — The American Surveyor (January 2009)",
            created,
          },
        },
      ],
      created,
      creatorUserId: "test-user",
    };
    const proJustificationJustification = makeJustificationViewModel({
      ...JustificationRef.parse({ id: "1897" }),
      created,
      target: {
        type: JustificationTargetTypes.PROPOSITION,
        entity: proJustificationProposition,
      },
      polarity: JustificationPolarities.POSITIVE,
      basis: {
        type: "MEDIA_EXCERPT",
        entity: proMediaExcerpt,
      },
    });

    const proTrailItems: ContextTrailItem[] = [
      {
        connectingEntity: proJustification,
        connectingEntityId: proJustification.id,
        connectingEntityType: "JUSTIFICATION",
        polarity: proJustification.polarity,
      },
    ];
    const proProTrailItems: ContextTrailItem[] = [
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
      ...PropositionRef.parse({ id: "1424" }),
      text: "In general, buildings in Washington, D.C. may be no taller than the width of their adjacent street plus 20 feet ",
      normalText:
        "In general, buildings in Washington, D.C. may be no taller than the width of their adjacent street plus 20 feet ",
      created,
    };
    const conJustification = makeJustificationViewModel({
      ...JustificationRef.parse({ id: "1905" }),
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
              propositionCompoundId: "example",
              entity: conJustificationProposition,
            },
          ],
        },
      },
    });
    const conMediaExcerpt: MediaExcerptView = {
      ...MediaExcerptRef.parse({ id: "1441" }),
      created,
      localRep: {
        quotation:
          "No building shall be erected, altered, or raised in the District of Columbia in any manner so as to exceed in height above the sidewalk the width of the street, avenue, or highway in its front, increased by 20 feet",
        normalQuotation:
          "No building shall be erected, altered, or raised in the District of Columbia in any manner so as to exceed in height above the sidewalk the width of the street, avenue, or highway in its front, increased by 20 feet",
      },
      speakers: [],
      creator,
      locators: {
        urlLocators: [
          {
            id,
            creatorUserId,
            key: "url-locator-example",
            autoConfirmationStatus: {
              status: "FOUND",
              earliestFoundAt: moment(),
              latestFoundAt: moment(),
              foundQuotation:
                "The Heights of Buildings Act of 1899 limited buildings in the District to 288 feet, the height of the Capitol building, in response to the newly erected 14-story Cairo apartment tower, then considered a monstrosity (now revered as outstandingly beautiful) towering over its Dupont Circle neighborhood.",
            },
            created,
            creator,
            mediaExcerptId: "example",
            url: brandedParse(UrlRef, {
              id: "example",
              url: "https://code.dccouncil.gov/us/dc/council/code/sections/6-601.05",
              canonicalUrl:
                "https://code.dccouncil.gov/us/dc/council/code/sections/6-601.05",
            }),
          },
        ],
      },
      citations: [
        {
          created,
          mediaExcerptId: "1976",
          creatorUserId,
          key: "citation-example",
          source: {
            id: "example",
            creator,
            creatorUserId: "example",
            description:
              "DC Code - § 6–601.05. Street width to control building height; business streets; residence streets; specified properties; structures above top story of building.",
            normalDescription:
              "DC Code - § 6–601.05. Street width to control building height; business streets; residence streets; specified properties; structures above top story of building.",
            created,
          },
        },
      ],
      creatorUserId: "test-user",
    };
    const conJustificationJustification = makeJustificationViewModel({
      ...JustificationRef.parse({ id: "example" }),
      created,
      polarity: JustificationPolarities.POSITIVE,
      target: {
        type: JustificationTargetTypes.PROPOSITION,
        entity: conJustificationProposition,
      },
      basis: {
        type: "MEDIA_EXCERPT",
        entity: conMediaExcerpt,
      },
    });

    const conTrailItems: ContextTrailItem[] = [
      {
        connectingEntity: conJustification,
        connectingEntityId: conJustification.id,
        connectingEntityType: "JUSTIFICATION",
        polarity: conJustification.polarity,
      },
    ];
    const conConTrailItems: ContextTrailItem[] = [
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

    const counterJustification = makeJustificationViewModel({
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
              propositionCompoundId: "example",
              entity: {
                ...PropositionRef.parse({ id: "1420" }),
                created,
                text: "The Height of Buildings Act of 1910 limits the height of buildings in Washington, D.C. based upon the width of a building's adjacent streets",
                normalText:
                  "The Height of Buildings Act of 1910 limits the height of buildings in Washington, D.C. based upon the width of a building's adjacent streets",
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
              style={{ width: "100%" }}
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
            <ContextTrail id="pro-context-trail" trailItems={proTrailItems} />
            <TreePolarity polarity="POSITIVE">
              <PropositionCard
                id={combineIds(
                  id,
                  "justified-proposition-example",
                  "proposition"
                )}
                contextTrailItems={proTrailItems}
                style={{ width: "100%" }}
                proposition={proJustificationProposition}
                showStatusText={false}
              />
            </TreePolarity>
          </div>
        </div>

        <p>
          Justifications can either support or oppose the truth of a
          proposition. (Justifications indented to the left support the things
          above them—those indented to the right oppose things above them.)
        </p>

        <div className="banner">
          <div className="banner-content">
            <ContextTrail id="con-context-trail" trailItems={conTrailItems} />
            <TreePolarity polarity="NEGATIVE">
              <PropositionCard
                id={combineIds(
                  id,
                  "opposing-justification-example",
                  "proposition"
                )}
                style={{ width: "100%" }}
                contextTrailItems={conTrailItems}
                proposition={conJustificationProposition}
                showStatusText={false}
              />
            </TreePolarity>
          </div>
        </div>

        <p>Good justifications have evidence.</p>

        <div className="banner">
          <div className="banner-content">
            <ContextTrail
              id="pro-context-trail"
              trailItems={proProTrailItems}
            />
            <TreePolarity polarity="POSITIVE">
              <MediaExcerptCard
                id="pro-evidence"
                style={{ width: "100%" }}
                mediaExcerpt={proMediaExcerpt}
                showStatusText={false}
              />
            </TreePolarity>
          </div>
        </div>

        <p>Better evidence makes a better justification</p>

        <div className="banner">
          <div className="banner-content">
            <ContextTrail
              id="con-context-trail"
              trailItems={conConTrailItems}
            />
            <TreePolarity polarity="POSITIVE">
              <MediaExcerptCard
                id="con-evidence"
                style={{ width: "100%" }}
                mediaExcerpt={conMediaExcerpt}
                showStatusText={false}
              />
            </TreePolarity>
          </div>
        </div>

        <p>Justifications can also counter other justifications.</p>

        <div className="banner">
          <div className="banner-content">
            <ContextTrail id="pro-context-trail" trailItems={proTrailItems} />
            <JustificationBranch
              justification={proJustificationCountered}
              contextTrailItems={proTrailItems}
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
            <Link to="https://chrome.google.com/webstore/detail/howdju-extension/gijlmlebhfiglpgdlgphbmaamhkchoei/">
              <div className="block-item-spacer">
                Install the extension to become an info hero
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
