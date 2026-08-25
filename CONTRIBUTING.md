# Contributing to the Parano1d website

Small corrections to the website are welcome. Independent projects may also request inclusion in the Links directory by editing [`ecosystem.json`](ecosystem.json).

## Links directory submissions

A Links directory pull request must:

- add a real, publicly available project that directly supports or documents Parano1d;
- link to an English-language landing page, documentation page or source repository over HTTPS;
- use a neutral, factual, third-person description;
- identify the maintainer and whether the project is open or closed source;
- link to a project page rather than directly to an executable or archive;
- disclose relevant limitations such as a pre-release status;
- avoid referral links, URL shorteners, promotional claims and token-price language.

Normally, a project should be submitted by its maintainer. Closed-source software is eligible, but it will be labelled as closed source and remains subject to additional scrutiny. Categories and their ordering are maintained by the Parano1d project; do not add or rename a category in a project-listing pull request.

Copy an existing entry, choose a unique lowercase `id`, and place it under the appropriate category. `supportUrl` is optional. Run the validator before opening the pull request:

```sh
python3 scripts/validate_ecosystem.py
```

Use a focused pull request title such as `links: add ExamplePool`. Do not combine a directory submission with unrelated website changes.

## Editorial decision

Submitting a pull request does not guarantee a listing. Every project, link and description is reviewed before merge. The maintainers may reject a submission based on relevance, quality, safety, misleading claims, duplication, inactivity or insufficient documentation. A merged listing may later be corrected or removed if the project becomes unavailable, unsafe or materially different from what was reviewed.

A directory entry is informational. It is not an audit, endorsement, partnership or warranty from Parano1d.
