import fs from "node:fs";
import path from "node:path";

const dir = path.join("src", "builtin", "commands");
const defs = [
  ["Init", "init", ["  init [w] [h]                         create empty canvas (default 800x600)"]],
  ["Create", "create", ["  create <type> <id> [params…] [in <g>]  create shape (rect/circle/ellipse/line/text/g)"]],
  ["Move", "move", ["  move <id> <dx> <dy>                  translate shape"]],
  ["Set", "set", ["  set <id> <attr> <value>              set attribute"]],
  ["Delete", "delete", ["  delete <id>                         delete shape (and descendants)"]],
  ["Group", "group", ["  group <gid> <id1> <id2>…             create g and adopt shapes"]],
  ["Ungroup", "ungroup", ["  ungroup <gid>                       dissolve nested g"]],
  ["AddTo", "addto", ["  addto <gid> <id>                    move shape into g"]],
  ["Front", "front", ["  front <id> / back <id>              z-order among siblings"]],
  ["Back", "back", []],
  ["Scale", "scale", ["  scale <id> <factor>                  scale geometry by factor"]],
  ["Canvas", "canvas", ["  canvas [w] [h]                      show or resize canvas"]],
  ["Save", "save", ["  save [file.svg]                     save document to svg"]],
  ["Read", "read", ["  read <file.svg>                     load document from svg"]],
  ["Undo", "undo", ["  undo / redo                         undo or redo last edit"]],
  ["Redo", "redo", []],
  ["Tree", "tree", ["  tree [id]                            show structure tree"]],
  ["Show", "show", ["  show <id>                            show shape attributes"]],
  ["Help", "help", ["  help                                 show this help"]],
];

for (const [Name, method, help] of defs) {
  const helpLit = help.map((h) => `    ${JSON.stringify(h)}`).join(",\n");
  const call =
    method === "help" ? "this.session.help()" : `this.session.${method}(args)`;
  const content = `import type { EditorSession } from "../../host/EditorSession.js";
import { SessionCliCommand } from "./SessionCliCommand.js";

export class ${Name}CliCommand extends SessionCliCommand {
  readonly name = "${method}";
  protected readonly help = [
${helpLit}
  ];

  constructor(session: EditorSession) {
    super(session);
  }

  execute(args: string[]): string {
    return ${call};
  }
}
`;
  fs.writeFileSync(path.join(dir, `${Name}CliCommand.ts`), content);
}

console.log(`generated ${defs.length} commands`);
