import { extension as ext } from "howdju-client-common";

document.addEventListener("DOMContentLoaded", restoreOptions);
saveButton().addEventListener("click", saveOptions);
// document.getElementById('remove-howdju-base-url').addEventListener('click', (event) => removeOption(event, 'howdjuBaseUrl'))

function saveOptions(event: MouseEvent) {
  event.preventDefault();
  const howdjuBaseUrl = howdjuBaseUrlInput().value;
  const isDevelopment = isDevelopmentInput().checked;
  ext.setStorageLocal(
    {
      howdjuBaseUrl,
      isDevelopment,
    },
    () => flashStatus("Options saved.")
  );
}

function restoreOptions() {
  ext.getStorageLocal(["howdjuBaseUrl", "isDevelopment"], (items) => {
    if (items.howdjuBaseUrl) {
      howdjuBaseUrlInput().value = items.howdjuBaseUrl;
    }
    isDevelopmentInput().checked = items.isDevelopment;
  });
}

function saveButton() {
  return document.getElementById("save") as HTMLButtonElement;
}

function howdjuBaseUrlInput() {
  return document.getElementById("howdju-base-url") as HTMLInputElement;
}

function isDevelopmentInput() {
  return document.getElementById("is-development") as HTMLInputElement;
}

// function removeOption(event, key) {
//   event.preventDefault()
//   ext.storage.local.remove(key)
//   const input = getInputForOptionKey(key)
//   input.value = ''
// }
//
// function getInputForOptionKey(key) {
//   const inputs = document.getElementsByTagName('input')
//   for (const input of inputs) {
//     if (input.getAttribute('data-option-key') === key) {
//       return input
//     }
//   }
//   return null
// }

function flashStatus(message: string, durationMs = 1500) {
  const status = document.getElementById("status");
  if (!status) {
    console.error(
      "Unable to flash status because element having id=status is missing."
    );
    return;
  }
  status.textContent = message;
  setTimeout(function () {
    status.textContent = "";
  }, durationMs);
}
