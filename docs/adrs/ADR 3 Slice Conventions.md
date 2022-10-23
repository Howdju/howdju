# ADR 3 Redux Slice conventions

@reduxjs/toolkit Slices enable a single definition of an action and a canonical reducer for that
action. We should use slices for all new pages and components.

## Slice exports

Export the slice for testing:

```typescript
export const myComponentSlice = createSlice({...})
```

The actions must be the default export since other files will import those most frequently:

```typescript
export default myComponentSlice.actions
```

Export the reducer as the name without the `Slice` suffix so that it is convenient to compose the
reducer.

```typescript
export const myComponent = myComponentSlice.reducer

// In reducers/index.ts:
import {myComponent} from "../components/myComponent/myComponentSlice"

combineReducers({
  myComponent,
  ...
})
```

## Sagas

### Location

Sagas that are appurtunent to a slice's actions or state should go in a separate file adjacent to
the slice file. Sagas that lack a single affinity for a slice should go into folder that is
reasonable based upon the circumstances. If there is no particular folder that makes sense, then
they go in a new file inside the project's root `sagas` folder.

### Saga exports

Add sagas in a separate file. Export them individually for testing. Compose them like:

```typescript
// in sagas/index.ts:
import * as myComponentSagas from '../components/myComponent/myComponentSagas'

export default () => all([
  all(mapValues(myComponentSagas, s => s())),
  ...
])
```
