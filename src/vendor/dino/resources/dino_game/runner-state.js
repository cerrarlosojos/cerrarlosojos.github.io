// Shared only by the active embedded game; never installed on window.
export let runnerState = null;
export function setRunnerState(value) {
  runnerState = value;
}
