# Contributing to the Parano1d website

Community projects are submitted through [GitHub Issues in ignotusnemo/parano1d-site](https://github.com/ignotusnemo/parano1d-site/issues/new?template=community-project.yml).

## Submit a project

1. Check the [community directory](https://parano1d.org/?community=1) for an existing listing.
2. Open the [Community project form](https://github.com/ignotusnemo/parano1d-site/issues/new?template=community-project.yml). Choose **Add a new project** or **Update an existing listing**.
3. Fill in the project name, HTTPS link, short description, maintainer, category and source code status. Add source, platform, documentation and support details where available.
4. Use the project name in the issue title and submit the form.

Maintainers review the project and discuss any questions in the issue. Accepted projects are added to `ecosystem.json` and published in the directory. The same form can be used to correct a description, replace a broken link or update supported platforms. A GitHub account is needed to submit an issue.

## Listing criteria

Submissions should describe a publicly available product, service or research resource that directly supports or documents Parano1d. Use a short, factual description and identify its maintainer.

Link to a project page, documentation or source repository over HTTPS. State whether the code is open or closed source. A public repository containing only binary releases is closed source. For open-source software, include a link to the code and license. Disclose relevant requirements, fees and release limitations.

Wallet links are limited to official Parano1d products in Official links. Individual tokens and NFT collections belong in Launchpad. Community project names and descriptions should make their independent status clear. Use direct links without referrals or URL shorteners.

## Catalog maintenance

The directory data is stored in [`ecosystem.json`](ecosystem.json). Maintainers and code contributors can use a focused pull request to implement an accepted submission or a small correction.

Use an existing category: `apps`, `analytics`, `tools`, `miners`, `pools`, `exchanges` or `research`. The `source` value is `open`, `closed` or `not-applicable`. Keep project IDs stable when updating an existing listing.

Optional `platforms` identify supported environments: `web`, `windows`, `linux`, `macos`, `android`, `ios` and `hiveos`. Use `relatedCategories` when a product belongs in another existing category. `sourceUrl`, `supportUrl`, `detailsUrl` and `announcementUrl` link to source, support, documentation and an announcement. Optional `notes` describe concrete requirements or release limitations. Pinning is curated by Parano1d.

Add or update only the relevant entry. Run the validator before opening a pull request:

```sh
python3 scripts/validate_ecosystem.py
```

Reference the submission issue in the pull request. For example, use `community: add ExamplePool` as the title and link to the accepted issue in its description.

## Review

Maintainers check relevance, availability, the project description and declared source status before publication. They may request more information or decline a listing based on quality, misleading claims, duplication or insufficient documentation. Published entries may be updated or removed as projects change.

Community builds are maintained by their authors. A directory listing is informational and does not represent a security audit or partnership.
