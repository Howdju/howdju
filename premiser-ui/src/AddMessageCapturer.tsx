import { useAddMessage } from "@react-md/alert";
import { useEffect } from "react";
import app from "./app/appSlice";
import { useAppDispatch } from "./hooks";

/**
 * This component is a hack to work around react-md's Toast/Snackbar/Alert design
 * where it is only possible to add messages from a functional component. Since
 * we want to add messages from sagas, we need to capture the addMessage function.
 *
 * TODO(#605) figure out a better approach to app toasts.
 */
export function AddMessageCapturer() {
  const addMessage = useAddMessage();
  const dispatch = useAppDispatch();
  // Only capture addMessage once.
  useEffect(() => {
    if (addMessage) {
      dispatch(app.captureAddMessage(addMessage));
    }
  }, [addMessage, dispatch]);
  return null;
}
