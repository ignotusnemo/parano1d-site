# Contributing to the Parano1d website

Small corrections to the website are welcome. Maintainers of independent projects may also request inclusion in Community builds by editing [`ecosystem.json`](ecosystem.json).

## Submit a community build

Each submission must:

- add a real, publicly available project that directly supports or documents Parano1d;
- link to an English-language landing page, documentation page or source repository over HTTPS;
- use a neutral, factual, third-person description;
- identify the maintainer and whether the project is open or closed source;
- link to a project page rather than directly to an executable or archive;
- make its independent, third-party status clear and avoid names or presentation that imply an official Parano1d release;
- disclose relevant limitations such as a pre-release status;
- avoid referral links, URL shorteners, promotional claims and token-price language.

Normally, a project should be submitted by its maintainer. Closed-source software is eligible, but it will be labelled as closed source and remains subject to additional scrutiny. Categories and their ordering are maintained by the Parano1d project; do not add or rename a category in a project-listing pull request.

Copy an existing entry, choose a unique lowercase `id`, and place it under the appropriate category. Use one of the existing category IDs: `analytics`, `miners`, `pools` or `research`. The `source` value must be `open`, `closed` or `not-applicable`; `supportUrl` is optional.

```json
{
  "id": "example-pool",
  "category": "pools",
  "name": "ExamplePool",
  "description": "Public Parano1d mining pool with setup and payout documentation.",
  "maintainer": "example-maintainer",
  "url": "https://example.org/parano1d",
  "source": "open",
  "tags": ["PUBLIC POOL"]
}
```

Add only this object to the `projects` array. Do not change `version`, `categories` or unrelated entries. Then run the validator before opening the pull request:

```sh
python3 scripts/validate_ecosystem.py
```

Use a focused pull request title such as `community: add ExamplePool`. Do not combine it with unrelated website changes.

## Editorial decision

Submitting a pull request does not guarantee inclusion. Every project page, description and declared source status is reviewed before merge. The maintainers may reject a submission based on relevance, quality, safety, misleading claims, duplication, inactivity or insufficient documentation. An accepted entry may later be corrected or removed if the project becomes unavailable, unsafe or materially different from what was reviewed.

A Community builds entry is informational. It is not an audit, endorsement, partnership or warranty from Parano1d.
