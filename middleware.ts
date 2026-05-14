// Netlify deployments require the middleware entry to be named "middleware".
// All logic lives in proxy.ts — this file simply re-exports it.
export { proxy as middleware, config } from "./proxy";
