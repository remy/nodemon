export type NodemonEventHandler =
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

export type NodemonEventListener = {
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

export type Nodemon = {
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

export type NodemonEventLog = {
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

export interface NodemonEventRestart {
  matched?: {
    result: string[];
    total: number;
  };
}

export type NodemonEventQuit = 143 | 130;
export type NodemonEventExit = number;

// TODO: Define the type of NodemonEventConfig
export type NodemonEventConfig = any;

export interface NodemonConfig {
  /* restartable defaults to "rs" as a string the user enters */
  restartable?: false | String;
  colours?: Boolean;
  execMap?: { [key: string]: string };
  ignoreRoot?: string[];
  watch?: string[];
  ignore?: string[];
  stdin?: boolean;
  runOnChangeOnly?: boolean;
  verbose?: boolean;
  signal?: string;
  stdout?: boolean;
  watchOptions?: WatchOptions;
}

export interface NodemonSettings extends NodemonConfig {
  script: string;
  ext?: string; // "js,mjs" etc (should really support an array of strings, but I don't think it does right now)
  events?: { [key: string]: string };
  env?: { [key: string]: string };
  exec?: string; // node, python, etc
  execArgs?: string[]; // args passed to node, etc,
  nodeArgs?: string[]; // args passed to node, etc,
  delay?: number;
}

export interface WatchOptions {
  ignorePermissionErrors: boolean;
  ignored: string;
  persistent: boolean;
  usePolling: boolean;
  interval: number;
}

const nodemon: Nodemon = (settings: NodemonSettings): Nodemon => {};

export default nodemon;
