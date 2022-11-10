# ADR 5 Import style

Guidelines about imports.

## lodash

Import `lodash` functions from the main package like:

```ts
import {merge} from 'lodash'
```

> modern tree-shaking bundlers like webpack and rollup can avoid bundling code you don't need even
> if you don't use direct imports or the babel plugin.

[https://lodash.com/per-method-packages](https://lodash.com/per-method-packages)
