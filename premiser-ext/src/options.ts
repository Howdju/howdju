import { extensionFacade as ext } from "howdju-client-common";
import { LiteralToPrimitive } from "type-fest";

const optionDefinitions = {
  howdjuBaseUrl: {
    storageArea: "local",
    default: "https://www.howdju.com",
    defaultOnEmpty: true,
  },
  isDevelopment: {
    storageArea: "local",
    default: false,
  },
} as const;
type OptionDefs = typeof optionDefinitions;
type OptionKey = keyof OptionDefs;
type OptionType<K extends OptionKey> = LiteralToPrimitive<
  OptionDefs[K]["default"]
>;
type Options<K extends OptionKey> = { [key in K]: OptionType<key> };
type Callback<K extends OptionKey> = (opts: Options<K>) => void;

export function getOptions<K extends OptionKey>(
  keys: [K],
  cb: Callback<K>
): void;
export function getOptions<K1 extends OptionKey, K2 extends OptionKey>(
  keys: [K1, K2],
  cb: Callback<K1 | K2>
): void;
export function getOptions<
  K1 extends OptionKey,
  K2 extends OptionKey,
  K3 extends OptionKey
>(keys: [K1, K2, K3], cb: Callback<K1 | K2 | K3>): void;
export function getOptions<Keys extends OptionKey[]>(
  keys: Keys,
  cb: Callback<Keys[number]>
): void {
  // TODO(402) group options by storageArea and request all from same storageArea at same time
  // (current approach might have network latency issues for sync settings.)
  const options = {} as Options<OptionKey>;
  keys.forEach((key) => {
    getOption(key, (value) => {
      (options[key] as any) = value;

      // Only call the callback after all options have been retrieved.
      if (Object.keys(options).length === keys.length) {
        cb(options);
      }
    });
  });
}

export function getOption<Key extends OptionKey>(
  key: Key,
  cb: (val: OptionType<Key>) => void
) {
  const optionDefinition = optionDefinitions[key];
  ext.getStorage(optionDefinition["storageArea"], [key], (items) => {
    let value = items[key];
    if (
      value === undefined ||
      ("defaultOnEmpty" in optionDefinition && value === "")
    ) {
      value = optionDefinitions[key]["default"];
    }
    cb(value);
  });
}
