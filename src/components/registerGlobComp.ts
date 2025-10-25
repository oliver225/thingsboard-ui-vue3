import type { App } from 'vue';
import { Button } from './Button';
import { Input } from 'ant-design-vue';
import { createTerminal, VueWebTerminal } from 'vue-web-terminal';

const terminal: VueWebTerminal = createTerminal();
terminal.configStoreName('shell-terminal-storage');

export function registerGlobComp(app: App) {
  app.use(Input).use(Button).use(terminal);
}
