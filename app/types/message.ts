import { MessageType } from "./messageType";
export interface Message<T = unknown> {
  type: MessageType;
  payload: T;
}
