# redux-persist-sqlite-storage

A redux-persist storage adapter that writes to [sqlite](https://github.com/mapbox/node-sqlite3).

This is adapted from https://github.com/prsn/redux-persist-sqlite-storage, but uses Node.js sqlite3 rather than react-native.

Great for Electron apps that are backed by Redux.

## install

npm i redux-persist-sqlite-storage

## usage

``` typescript
// configureStore.ts
import { createStore } from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import { SQLiteAdapter }  from 'redux-persist-sqlite-storage'

const yourDbName = 'redux-persist.db';
const pathToYourDB = path.join(process.cwd(), yourDbName);

const rootPersistConfig = {
  key: 'root',
  storage: new SQLiteAdapter(pathToYourDB)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export function configureStore() {
  const store = createStore(persistedReducer);
  const persistor = persistStore(store);
  return { store, persistor };
}
```