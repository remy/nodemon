type NodemonEventHandler =
  | 'start'
  | 'crash'
  | 'exit'
  | 'quit'
  | 'restart'
  | 'config:update'
  | 'log'
  | 'readable'
  | 'stdout'
  | 'stderr';

type NodemonEventListener = {
  on(event: 'start' | 'crash' | 'readable', listener: () => void): Nodemon;
  on(event: 'log', listener: (e: NodemonEventLog) => void): Nodemon;
  on(event: 'stdout' | 'stderr', listener: (e: string) => void): Nodemon;
  on(event: 'restart', listener: (e?: NodemonEventRestart) => void): Nodemon;
  on(event: 'quit', listener: (e?: NodemonEventQuit) => void): Nodemon;
  on(event: 'exit', listener: (e?: NodemonEventExit) => void): Nodemon;
  on(
    event: 'config:update',
    listener: (e?: NodemonEventConfig) => void
  ): Nodemon;
};

type Nodemon = {
  (options?: NodemonSettings): Nodemon;
  on(event: 'start' | 'crash', listener: () => void): Nodemon;
  on(event: 'log', listener: (e: NodemonEventLog) => void): Nodemon;
  on(event: 'restart', listener: (e?: NodemonEventRestart) => void): Nodemon;
  on(event: 'quit', listener: (e?: NodemonEventQuit) => void): Nodemon;
  on(event: 'exit', listener: (e?: NodemonEventExit) => void): Nodemon;
  on(
    event: 'config:update',
    listener: (e?: NodemonEventConfig) => void
  ): Nodemon;

  // this is repeated because VS Code doesn't autocomplete otherwise
  addEventListener(event: 'start' | 'crash', listener: () => void): Nodemon;
  addEventListener(
    event: 'log',
    listener: (e: NodemonEventLog) => void
  ): Nodemon;
  addEventListener(
    event: 'restart',
    listener: (e?: NodemonEventRestart) => void
  ): Nodemon;
  addEventListener(
    event: 'quit',
    listener: (e?: NodemonEventQuit) => void
  ): Nodemon;
  addEventListener(
    event: 'exit',
    listener: (e?: NodemonEventExit) => void
  ): Nodemon;
  addEventListener(
    event: 'config:update',
    listener: (e?: NodemonEventConfig) => void
  ): Nodemon;

  once(event: 'start' | 'crash', listener: () => void): Nodemon;
  once(event: 'log', listener: (e: NodemonEventLog) => void): Nodemon;
  once(event: 'restart', listener: (e?: NodemonEventRestart) => void): Nodemon;
  once(event: 'quit', listener: (e?: NodemonEventQuit) => void): Nodemon;
  once(event: 'exit', listener: (e?: NodemonEventExit) => void): Nodemon;
  once(
    event: 'config:update',
    listener: (e?: NodemonEventConfig) => void
  ): Nodemon;

  removeAllListeners(event: NodemonEventHandler): Nodemon;
  emit(type: NodemonEventHandler, event?: any): Nodemon;
  reset(callback: Function): Nodemon;
  restart(): Nodemon;
  config: NodemonSettings;
};

type NodemonEventLog = {
  /**
    detail*: what you get with nodemon --verbose.
    status: subprocess starting, restarting.
    fail: is the subprocess crashing.
    error: is a nodemon system error.
  */
  type: 'detail' | 'log' | 'status' | 'error' | 'fail';
  /** the plain text message */
  message: String;
  /** contains the terminal escape codes to add colour, plus the "[nodemon]" prefix */
  colour: String;
};

interface NodemonEventRestart {
  matched?: {
    result: string[];
    total: number;
  };
}

type NodemonEventQuit = 143 | 130;
type NodemonEventExit = number;

// TODO: Define the type of NodemonEventConfig
type NodemonEventConfig = any;

interface NodemonSettings {
  /* restartable defaults to "rs" as a string the user enters */
  restartable?: false | String;
  colours?: Boolean;
  execMap?: { [key: string]: string };
  ignoreRoot?: string[];
  watch?: string[];
  stdin?: boolean;
  runOnChangeOnly?: boolean;
  verbose?: boolean;
  signal?: string;
  stdout?: boolean;
  watchOptions?: WatchOptions;
}

interface WatchOptions {
  ignorePermissionErrors: boolean;
  ignored: string;
  persistent: boolean;
  usePolling: boolean;
  interval: number;
}
