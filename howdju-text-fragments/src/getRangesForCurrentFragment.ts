import * as utils from "text-fragments-polyfill/text-fragment-utils";

const FRAGMENT_DIRECTIVES = ["text"];
type FragmentType = "text";

function getRangesForCurrentFragment():
  | Record<FragmentType, Range[]>
  | undefined {
  const hash = window.location.hash;
  if (!hash) {
    return undefined;
  }

  const fragmentDirectives = utils.getFragmentDirectives(hash);
  const parsedFragmentDirectives =
    utils.parseFragmentDirectives(fragmentDirectives);
  const processedFragmentDirectives = {} as Record<string, Range[]>;
  for (const [
    fragmentDirectiveType,
    fragmentDirectivesOfType,
  ] of Object.entries(parsedFragmentDirectives)) {
    if (FRAGMENT_DIRECTIVES.includes(fragmentDirectiveType)) {
      processedFragmentDirectives[fragmentDirectiveType] =
        fragmentDirectivesOfType.map((fragmentDirectiveOfType) => {
          const ranges = utils.processTextFragmentDirective(
            fragmentDirectiveOfType
          );
          // If more than one range matches the fragment, the spec dictates choosing the first.
          return ranges[0];
        });
    }
  }
  return processedFragmentDirectives;
}

window.getRangesForCurrentFragment = getRangesForCurrentFragment;
