


const statements = [
  {
    id: 1,
    slug: 'the-american-health-care-reform-act-of-2017',
    text: "The American Health Care Reform Act of 2017 (H.R.277) is an improvement over The Affordable Care Act",
  },
]

const justifications = [
  {
    id: 1,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: { type: 'STATEMENT', entity: { id: 2, text: "The American Health Care Reform Act of 2017 will reduce federal deficits by $337 by 2026" } },
    polarity: 'POSITIVE',
    score: 1,
  },
  {
    id: 6,
    target: { type: 'STATEMENT', entity: { id: 1 } },
    basis: {
      type: 'REFERENCE',
      entity: {
        id: 1,
        quote: 'Generally, people who are older, lower-income, or live in high-premium areas (like Alaska and Arizona) ' +
        'receive larger tax credits under the ACA than they would under the American Health Care Act replacement.',
        citation: {
          id: 1,
          text: 'Tax Credits under the Affordable Care Act vs. the American Health Care Act: An Interactive Map',
        },
        urls: [
          {
            id: 1,
            url: 'http://kff.org/interactive/tax-credits-under-the-affordable-care-act-vs-replacement-proposal-interactive-map/'
          },
        ]
      }
    },
    polarity: 'NEGATIVE',
    score: 6,
  }
]