# Comparisons with other platforms

This page compares and contrasts Howdju with other platforms.

## Comparison to well-known platforms

The following sections compare Howdju to well known platforms that provide a
crowdsourced fact checking role even though that may not be their explicity
goal.

### Wikipedia

Howdju is like Wikipedia in that it focuses on facts and evidence. Howdju is
more like reddit or Stackoverflow in terms of the process it uses to accept and
present facts and evidence.

Wikipedia pages have a single representation at any time that is the result of a
highly moderated consensus. Some pages are even locked, preventing ordinary
users from making any contributions.

Howdju users do not require consensus to create content or to present it.
instead consensus on Howdju contributes to the relative ranking of content.
Users can create a new Proposition at any time, can add their own justifications
to other's Proposoitions, can add Appearances to other's Propositions, etc.
Users can share views of their own content and other users can contribute to
that content directly.

Compare that with Wikipedia where, although you can share a link to a previous
version of a page you wrote, if your contribution was reverted by a moderator,
no one can contribute on top of your content since it will contain the same
content that the moderator originally reverted, and they will revert it again.

### Reddit

Howdju is inspired by Reddit's threading model, but Howdju does not accept free
form text, links, and media. Howdju content is focused on claims and evidence,
and so has a more restrictive data model. Howdju also splits threads into two
sides: one for Pro justifications and one for Con justifications.

Reddit's distributed totalitarian moderation model was initially highly
successful, but has been deteriorating in recent years. Subreddit moderators now
ban users who express even mildly contrarian views, creating information silos /
"filter bubbles".

### Twitter

Similar to Reddit, Twitter accepts free form text, link, and media and has no
domain primitives for claim or evidence.

Twitter's Community Notes (formerly Birdwatch) provide a crowdsourced fact
checking layer on top of Twitter's content. Community notes have two major
drawbacks:

1. Only a single Community Note can appear on a Tweet.

   This limitation prevents alternative or complementary Notes from appearing on
   the same Tweet. This limitation means that a single Community Note must try
   to encompass all of the most important feedback on a Tweet, which is
   especially challenging since Notes have the same length limitations as Tweets
   (at least for non-premium subscribers.)

2. It is not possible to respond to a Community Note.

   This limitation means that if a Community Note is approved, no important
   rebuttal or contradicting context can be added to note. This also means that
   there is limited opportunity to incrementally improve a Community Note
   through feedback.

### Quora

Quora questions and answers are closer to Howdju's Propositions and
Justifications than Wikipedia pages: they allow multiple concurrent alternative
responses to a question. But the Q&A data model is inferior to Propositions and
Justifications for consolidating similar claims. Quora has no special domain
model for evidence or for factchecking sources.

### Stackoverflow

Stackoverflow has a simple structured domain model and very strong documentation
and community norms around acceptable content. Its gamification contributes to
healthy participation with minimal detraction, and its privilege-based
moderation and elected moderators are effective. Its meta community provides a
mostly productive way for users to communicate about content and moderation.

Stackoverflow relies upon aggressive manual moderation to remove duplicate
content and does not intentionally tolerate similar questions that differ based
on subtle nuanced wording differences.

Stackoverflow (and the more generic Stackexchange technology) has no features
geared directly to facts and evidence. There is a Stackexchange dedicated to
critiquing claims
([skeptic.stackexchange.com](https://skeptics.stackexchange.com)), but it has
very strict rules for its answers, forbidding answers that synthesize sources or
perform novel mathematical calculations. E.g. see [this
answer](https://skeptics.meta.stackexchange.com/a/2925/47976) and [this
answer](https://skeptics.meta.stackexchange.com/a/2930/47976).

The problem with forbidding these types of answers is that sometimes those
answers are what people are thinking or alluding to in their communications
without coming out and specifying them. Since people frequently form beliefs
based on 'common sense' and 'mental mathematical estimation', the skeptics
stackexchange does its community a disservice by forbidding these types of
answers.

The problem, however, may not be the community's, but the tool's: Stackexchange
only allows two levels of threading, and the second level is inferior to the
first: Questions, Answers, and Comments. This limitation means that an answer
based on invalid assumptions or reasoning is only open to critique through the
comments, which are not sorted by vote and offer a poorer UX compared to
Answers.

Howdju's assumption is that it is better for people to share their reasoning
explicitly, even if it is invalid, because then it is amenable to critique.
Howdju's recursive domain model (Propositions are the targets of Justifications,
which contain Propositions, which can be the targets of more Justifications,
etc.) allows critique of such content.

### Lobste.rs

While perhaps not as well known as HackerNews, I admire Lobste.rs transparent
moderation history and its invite structure.

## Comparisons to similar projects

The following sections compare Howdju to other crowdsourced argument mapping or
fact checking projects.

### Kialo

- Cannot reuse claims
- Limited evidence handling

### Two dimensional maps

Examples:

- ponder.wiki
- debatemap.app

Two dimensional maps are useful for providing users quick visual context for a
larger argument. They work best for closed participant argument mapping because
the branching factor is relatively low and the relevance of the content to each
participant is high.

One powerful feature of a two-dimensional map is that it uses two-dimensional
space to provide context to a user as they navigate the graph of entities.
Howdju may explore adding a two-dimensional map in the future, but currently uses
a [ContextTrail](/design/features#contexttrail) to provide context during deep
navigation.

An open participation platform must handle an influx of new inexperienced users
who may duplicate content or create low quality content. One mandatory response
to this is education of community norms and moderation. But moderation doesn't
scale well, and it takes time for users to internalize community norms.

Howdju's two column approach provides a natural experience to exploring the
arguments for and against a claim. As users explore lower ranked items in one
column, they are organically exposed to additional content from alternative
viewpoints.

An influx of new content will be ranked below existing quality content, but also
immediately acessible to users to rank via infinite scrolling through the
columns. This helps ensure that new content is crowd moderated.

### Rating claims directly

Some tools allow users to explicitly rate claims' truthfulness. This approach
allows users to engage in expressive voting, where they vote for something
because they already believe it rather than because they have found a justified
reason for believing it.

Howdju instead asks users to vote on the Justifications of Propositions. While
no system that scores a value based on user input is immune to manipulation,
this design encourages users both to focus on why they believe something rather
than what they already believe, forces them to expend the effort to add (or at
least find) a justification if they want to support a Proposition, and it helps
users who want to argue against the proposition to understand what the best
arguments are of those who believe in the Proposition.
