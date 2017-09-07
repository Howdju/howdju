import React from 'react'
import Card from 'react-md/lib/Cards/Card'
import CardText from 'react-md/lib/Cards/CardText'

const PrivacyPage = props => (
  <div className="md-grid">
    <Card className="md-cell--12">
      <CardText>
        <h3>How Howdju uses information on your computer</h3>
        <p>
          Howdju.com uses browser features such as local and session storage and to persist information to improve your
          experience using the application. For example, we store an authentication token in your browser's local
          storage so that requests for information after you login are automatically authorized.
        </p>
        <h3>Third-party&rsquo;s cookies</h3>
        <p>
          Howdju.com includes services that may set cookies on your machine to improve your experience with the
          services.  Howdju does not provide any personally identifiable information to these services.  We generate
          special-purpose distinct unique identifiers to connect any activity on Howdju.com with information recorded
          by these services.  If you explicitly enter your personal information, such as name or email address,
          when using these services (e.g., while using the smallchat widget) then this information may be transmitted directly
          to these services.
        </p>
        <ul>
          <li>smallchat website messaging &emdash; allows you to chat with us directly from our website</li>
          <li>Google Analytics, Heap, and mixpanel &emdash; allows us to analyze anonymized usage data</li>
          <li>Sentry.io error monitoring &emdash; allows us to monitor any errors that occur on the site</li>
        </ul>
      </CardText>
    </Card>
  </div>
)
export default PrivacyPage
