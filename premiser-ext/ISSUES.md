# Issues

TODO(499) migrate the contents of this file to Github issues.

## Part of this feature

- Persist target (it is an appearance of the Sentence)
- Delete temporary annotation if the user doesn't create the justification
  - if start another annotation, delete in page and cancel on website
  - If cancel on website, delete from page
  - If navigate away from, clear out form and delete from page

## Next Features

- If extension opened on from browser action, should navigate to searching for exact url and domain!
- Extension needs to request annotations of current URL upon page load

## would be nice

- Wrap changes in https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame ?
- Should it be Annotation.nodeGroups, not nodes? and then we can derive content from the nodeGroups by creating a range encompassing the
  first and last of each node group and calling toString on it. Doing that for all node groups and then concatenating them.
- Don't load extension on every action. Just on every page reload or something.
- Replace glamor. With either webpack to a css file to be included with other project css, or whatever react-md prefers now
- compaction (see below)
- Improving attachment:
  - variable length text before/after
  - include full word before/after
  - sentence before/after
  - first/last sentence of containing paragraph
  - first/last sentence of previous/next paragraph

## Compaction:

Before:

```text
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
---------------------
-------
```

Insert:

```text
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
-----------
---------------------
                       -------
```

Compact:

```text
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
-----------            -------
---------------------
```
