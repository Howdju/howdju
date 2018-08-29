import React  from 'react'
import {Card, CardText} from 'react-md'

import './AboutPage.scss'

const AboutPage = () => (
  <div className="md-grid" id="about-page">
    <Card className="md-cell--12">
      <CardText>
        <p>
          Howdju is a platform to fight disinformation online premised upon three hypotheses:
        </p>
        <ol>
          <li>
            We are more open to alternative perspectives when we share why we believe what
            we believe than when we are told what is correct or incorrect. (&ldquo;How d&rsquo;ya know that&hellip;?&rdquo;)
          </li>
          <li>
            Doubt and resistance will persist until we we are confident that all sides have had an opportunity
            to present all perspectives and respond to others&rsquo; perspectives.
          </li>
          <li>
            We need an efficient way to evaluate new information, because fact-checking everything would take too
            much time.
          </li>
        </ol>

        <h2>Research supports this approach</h2>
        <p>
          <a href="http://dx.doi.org/10.1080/23808985.1999.11678963"
             title="Daniel J. O’Keefe (1999) How to Handle Opposing Arguments in Persuasive Messages: A Meta-Analytic Review of the Effects of One-Sided and Two-Sided Messages, Annals of the International Communication Association, 22:1, 209-249, DOI: 10.1080/23808985.1999.11678963"
          >
            Research
          </a> indicates that two-sided messaging that includes counter-arguments is much more persuasive than without.
          <a href="https://www.poynter.org/news/fact-checking-doesnt-backfire-new-study-suggests"
             title="Fact-checking doesn't 'backfire,' new study suggests, Alexios Mantzarlis, November 2, 2016 citing Wood, Thomas and Porter, Ethan, The Elusive Backfire Effect: Mass Attitudes’ Steadfast Factual Adherence (December 31, 2017)"
          >
            Research
          </a> also indicates that the "backfire effect" may occur for isolated incidents based upon wording of the
          correction.  "[B]y and large, citizens heed factual information, even when such information challenges
          their partisan and ideological commitments."
        </p>

        <h2>Introduction</h2>
        <p>
          Information online is growing fast.  Besides the large amount of information generated daily by traditional
          news and institutional sources, social media and a variety of new media sources are generating information
          faster than the average person can keep up.  New tools are needed to help people aggregate and filter the
          content that is most relevant to them and to help them to evalute new information efficiently.
        </p>
        <p>
          One of the greatest impediments to human well-being is lack of mutual understanding.  Howdju is designed
          to expose users to alternative viewpoints to try and help people to understand better where the other is coming
          from.  It is also intended to provide people the best information to evaluate different perspectives on issues
          to help inform their dialog.
        </p>
        <p>
          Howdju is a platform to help people stay informed.  Its primary objective is to help people effectively understand
          the massive amount of information that we increasingly need to digest to make decisions about our lives.
          Howdju&rsquo;s vision is both to help people remain informed about the high level events and currents of our societies,
          while allowing them to dig deeply into the specifics of those events, all while helping us to keep track of what
          was learned.
        </p>

        <h2>Howdju&rsquo;s goals</h2>
        <ul>
          <li>Collect the best information</li>
          <li>Empower people to have conversations based upon the best information</li>
          <li>Inform people when events relevant to their interests occur</li>
          <li>Help people keep track of things they want to follow up on later</li>
        </ul>

        <h2>Democracy &amp; social cohesion</h2>
        <p>
          Democratic government depends upon its citizens getting good information in a timely fashion.  If citizens
          do not receive good information when they need it, or, worse, if they receive bad information, then
          democratic government suffers.  Special interests that do not necessarily reflect the best interests of a
          country can influence opinion with bad information, leading to the break down of the concensus which is
          necessary for democratic government to survive.
        </p>
        <p>
          As societies grow in population, citizens grow increasingly disconnected from each other.  This is just an
          outcome of the limit on the human ability to maintain relationships and keep track of information.  At the
          same time, as technology advances, a society&rsquo;s ability to create and share information increases.  But
          a society&rsquo;s ability to separate good information from bad information does not necessarily grow at the
          same time.  This creates a dangerous situation where segments of the population can become disconnected from
          one another in opinion, based upon a lack of consensus of what is true.
        </p>
        <p>
          In smaller, less technologically advanced societies, social cohesion was created by a combination of
          editorialization and citizen communication.  These two channels of verifying information cannot keep up with
          a growing society: technology has weakened the power of editorialization, both for good and for bad.  Now
          that anyone can create &ldquo;news&rdquo; in a few easy steps (1. register a domain,
          2. perform a few clicks to install a blogging platform with a professional theme, 3. write anything you want
          at all, 4. share via social media and/or advertising.) it can be difficult to tell the good news from the bad.
          Growing population has weakened citizen communication.
        </p>
        <p>
          Assuming increasing population growth and technological advancement, democratic governments must discover ways
          to balance the influence of bad information. The thesis of Howdju is that in order to do so, a system must
          bring together all the information, both the good and the bad, present them side-by-side, and provide tools
          for tracking the good and the bad information.
        </p>

      </CardText>
    </Card>
  </div>
)
export default AboutPage