# Metrics (auto-generated)

Generated: 2026-11-26T02:56:52.316Z

## Lines of code by bucket

| Bucket | Lines |
|---|---|
| kernel | 2472 |
| assembly | 1246 |
| plugins | 704 |
| other | 0 |
| **sum** | **4422** |

## File inventory

| File | Bucket | Lines |
|---|---|---|
| `plugins/command-dir/src/DirCliCommand.ts` | plugins | 33 |
| `plugins/command-dir/src/FakeDirectoryAccess.ts` | plugins | 30 |
| `plugins/command-dir/src/formatDirListing.ts` | plugins | 30 |
| `plugins/command-dir/src/IDirectoryAccess.ts` | plugins | 19 |
| `plugins/command-dir/src/index.ts` | plugins | 33 |
| `plugins/command-dir/src/NodeFsDirectoryAccess.ts` | plugins | 31 |
| `plugins/command-stats/src/collectStats.ts` | plugins | 57 |
| `plugins/command-stats/src/index.ts` | plugins | 13 |
| `plugins/command-stats/src/StatsCliCommand.ts` | plugins | 25 |
| `plugins/shape-box/src/Box.ts` | plugins | 103 |
| `plugins/shape-box/src/BoxAttributeHandler.ts` | plugins | 79 |
| `plugins/shape-box/src/BoxShapeProvider.ts` | plugins | 50 |
| `plugins/shape-box/src/index.ts` | plugins | 18 |
| `plugins/tree-box-label/src/BoxTypeLabelDecorator.ts` | plugins | 26 |
| `plugins/tree-box-label/src/index.ts` | plugins | 11 |
| `plugins/tree-star/src/index.ts` | plugins | 11 |
| `plugins/tree-star/src/ModifiedStarDecorator.ts` | plugins | 95 |
| `plugins/tree-star/src/shapeFingerprint.ts` | plugins | 40 |
| `src/builtin/commands/AddToCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/BackCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/CanvasCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/CreateCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/DeleteCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/FrontCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/GroupCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/HelpCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/InitCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/MoveCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/ReadCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/RedoCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/SaveCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/ScaleCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/SessionCliCommand.ts` | assembly | 20 |
| `src/builtin/commands/SetCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/ShowCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/TreeCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/UndoCliCommand.ts` | assembly | 18 |
| `src/builtin/commands/UngroupCliCommand.ts` | assembly | 18 |
| `src/builtin/registerBuiltins.ts` | assembly | 69 |
| `src/builtin/shapes/applyStyle.ts` | assembly | 11 |
| `src/builtin/shapes/CircleShapeProvider.ts` | assembly | 32 |
| `src/builtin/shapes/EllipseShapeProvider.ts` | assembly | 33 |
| `src/builtin/shapes/GroupShapeProvider.ts` | assembly | 19 |
| `src/builtin/shapes/LineShapeProvider.ts` | assembly | 34 |
| `src/builtin/shapes/parseNumbers.ts` | assembly | 21 |
| `src/builtin/shapes/RectShapeProvider.ts` | assembly | 33 |
| `src/builtin/shapes/TextShapeProvider.ts` | assembly | 28 |
| `src/cli/CommandDispatcher.ts` | assembly | 25 |
| `src/cli/main.ts` | assembly | 5 |
| `src/cli/Repl.ts` | assembly | 53 |
| `src/cli/tokenize.ts` | assembly | 40 |
| `src/commands/AddToCommand.ts` | kernel | 53 |
| `src/commands/AttributeHandlerCommand.ts` | kernel | 58 |
| `src/commands/BackCommand.ts` | kernel | 32 |
| `src/commands/CreateCommand.ts` | kernel | 36 |
| `src/commands/DeleteCommand.ts` | kernel | 37 |
| `src/commands/FrontCommand.ts` | kernel | 43 |
| `src/commands/GroupCommand.ts` | kernel | 72 |
| `src/commands/ICommand.ts` | kernel | 9 |
| `src/commands/MoveCommand.ts` | kernel | 38 |
| `src/commands/ScaleCommand.ts` | kernel | 27 |
| `src/commands/SetCommand.ts` | kernel | 44 |
| `src/commands/UngroupCommand.ts` | kernel | 67 |
| `src/extensions/AttributeHandlerRegistry.ts` | kernel | 29 |
| `src/extensions/CommandRegistry.ts` | kernel | 26 |
| `src/extensions/IAttributeHandler.ts` | kernel | 48 |
| `src/extensions/ICliCommand.ts` | kernel | 15 |
| `src/extensions/IShapeProvider.ts` | kernel | 23 |
| `src/extensions/ITreeDecorator.ts` | kernel | 27 |
| `src/extensions/PluginContext.ts` | kernel | 24 |
| `src/extensions/ShapeRegistry.ts` | kernel | 36 |
| `src/extensions/TreeDecoratorRegistry.ts` | kernel | 38 |
| `src/history/History.ts` | kernel | 59 |
| `src/host/createApp.ts` | assembly | 96 |
| `src/host/EditorSession.ts` | assembly | 385 |
| `src/io/SvgReader.ts` | kernel | 241 |
| `src/io/SvgWriter.ts` | kernel | 32 |
| `src/model/Circle.ts` | kernel | 128 |
| `src/model/Document.ts` | kernel | 413 |
| `src/model/Ellipse.ts` | kernel | 143 |
| `src/model/Group.ts` | kernel | 118 |
| `src/model/Line.ts` | kernel | 138 |
| `src/model/Rect.ts` | kernel | 143 |
| `src/model/Shape.ts` | kernel | 101 |
| `src/model/ShapeFactory.ts` | kernel | 44 |
| `src/model/Text.ts` | kernel | 130 |

## Cyclomatic complexity delta

_Pending: compare `final` → `p2` with dedicated complexity script at Exp-D0._
