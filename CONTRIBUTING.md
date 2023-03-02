# Contribution guidelines

## Acceptance of open source license

(We put this first because it's really important that you read it.)

This repository enforces the ["Developer Certificate of Origin"](https://developercertificate.org/)
(DCO), which means that authors must add a
`Signed-off-by` line to their commit messages certifying the DCO for their contribution.

If your employement agreement contains a copyright assignment, it may prevent you from legally
certifying the DCO. Please consult your HR or legal department to determine if such a restriction
applies to you, and if you can obtain a waiver for open source contributions to Howdju.

## Reporting issues

When reporting issues, please consider and describe the problem you encountered or that you
want to solve rather than jumping immediately to the solution you envision. (I.e., let's avoid the
[XY problem](https://mywiki.wooledge.org/XyProblem)). If you have ideas about the solution, those
are great to include too, but we want to be very clear and explicit about the 'root cause' of the
issue as compared to the possible solutions.

For errors, please include all information necessary to reproduce the issue, if possible.
Screenshots or recordings are appreciated.

## PR lifecycle

### Selecting issues

Looking at our [labels](https://github.com/Howdju/howdju/labels) may give you an overview of the
types of open issues we have. The ["good first
issue"](https://github.com/Howdju/howdju/labels/good%20first%20issue) is good for people unfamiliar
with the code base.

### Validating approaches/designs

Please ensure that you have vetted substantial changes with a maintainer. Ways to do that include:

- Reach out on Slack to get feedback on your idea/approach/solution
- Leave a Github comment on the issue explaining your idea/approach/solution
- For more complex issues, you may want to write up a [doc](https://docs.new) describing the problem
  and potential solutions.

### Pair programming and mentoring

Ping us on Slack if your issue would benefit from a pair programming session or if you are
interested in mentoring.

### Pull requests

You will fork the Howdju repo and then create a pull request to merge a branch from your fork into
Howdju's master branch.

## CI

We have a CI pipeline that runs on PRs to ensure their quality. Please ensure that your contribution
adds any necessary tests or checks to ensure it's ongoing quality and correctness. Run the checks
locally (`yarn run check:everything`) to avoid surprises.

### Automated tests

We support the 'shift left' approach, which means to use automated tests as early as practical in
the development lifecycle to catch errors.

We require all changes to include reasonable test coverage to ensure the ongoing correctness and
quality of the contribution. We do not allow dependency on manual testing except in extreme
circumstances. Please see the subsections on tests/testing in the README and Development docs for
details on different test types and infra.

### Automated formatting

Our CI pipeline requires all code to conform to [Prettier](https://prettier.io/). If you have not used
opinionated automatic formatting before, this may feel awkward, because you have limited options to
tweak formatting in your code. The benefit, however, is that we don't need to spend time
documenting, socializing, and enforcing a style guide across all contributors.

To assist in this, we recommend modifying your editor to:

- [Use Prettier for formatting](https://prettier.io/docs/en/editors.html)
- Format on save

We provide a yarn command for fixing the formatting of all files.
