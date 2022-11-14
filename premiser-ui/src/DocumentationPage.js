import React from "react";
import { Card, CardText } from "react-md";

const DocumentationPage = (props) => (
  <div className="md-grid">
    <Card className="md-cell--12">
      <CardText>
        <h3>Good sources</h3>
        <p>
          Good sources come from experts who have spent time studying the
          matter, who are in a position to be impartial, and who present the
          information in a way that supports scrutiny over time.
        </p>

        <h4>Scrutiny over time</h4>
        <p>
          One of the best indicators that a source of information is good is
          that it has been widely known for a long time but not shown to be
          false. It must be widely known and published so that people can have
          attempted to find any inaccuracies. And of course no one must have
          found any glaring problems. The more amenable to criticism the source
          is, the more reliable its information. If it has been widely
          published, but not in a way that was open to published
          counter-scrutiny, then there may be problems with the source that are
          not known. This characteristic is one of the fundamental design
          principles of Howdju: everyone can access the information on
          howdju.com, and anyone can instantly publish critical analysis
          globally.
        </p>

        <h2>Justifications</h2>

        <h3>Justification bases and targets</h3>
        <p>
          Justifications are connections between facts Justifications draw
          support from a basis (plural, bases.) They impute that truth to their
          target. The quality of the justification depends upon whether the
          basis is aptly chosen for the target.
        </p>

        <h4>Quote basis</h4>
        <p>
          A quote is an excerpt from a text-based source of information. In our
          day-to-day lives when we refer to books, news articles, expert
          opinion, research, etc. we are citing these sources of information to
          support some conclusion. The strength of the support depends on how
          reliable we think the cited source is. If we have a good reason to
          believe that the cited source is accurate. See below for details on
          the nature of good sources.
        </p>

        <h4>Propositions basis</h4>

        <h4>Proposition target</h4>
        <p>
          When justifications target propositions, they attempt to impute their
          basis to either prove that the proposition is true (if it is a
          supporting justification) or that the proposition is false (if it is
          an oppositing justification.)
        </p>

        <h4>Counter-justifications</h4>
        <p>
          Justifications can also be used to weaken other justifications. Just
          like a counter-argument is an organized set of thoughts against some
          proposition, a counter-justification is intended to show someone how a
          justification is actually not as effective as it otherwise appeared.
        </p>
      </CardText>
    </Card>
  </div>
);
export default DocumentationPage;
