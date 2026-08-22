## Usage

Create an "Essential" page, *e.g.* an *Essential Records*:

```shell
hugo new content --kind essential/records essential/records/some-genre.md
```

Create a new post:

```shell
hugo new content blog/some-post
```

## Content updates

Pages carry an `updatedAt` front matter field that records the last time their
content changed. It feeds Hugo's `.Lastmod`, so it shows up next to the
publication date on the page, in the sitemap and in the `dateModified` of the
structured data. Pages that were never edited after publication simply don't
have the field, and don't display an update date.

The field is maintained by a pre-commit hook. Enable it once per clone:

```shell
git config core.hooksPath .githooks
```

The hook stamps every `content/**/*.md` file that the commit modifies. It skips
newly added files (their `date` already covers it), commits that only bump
`updatedAt`, and files with unstaged changes — those it reports and leaves
alone, to avoid staging hunks you kept back on purpose.

To override a stamp, edit `updatedAt` by hand and commit: the hook only rewrites
files whose content actually changed.
