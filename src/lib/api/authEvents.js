import { EventEmitter } from "expo";
export const authEvent = new EventEmitter();
// Usage: authEvents.emit('logout') anywhere → AuthProvider catches it
