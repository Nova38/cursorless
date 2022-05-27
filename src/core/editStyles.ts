import {
  DecorationRangeBehavior,
  DecorationRenderOptions,
  Range,
  TextEditor,
  TextEditorDecorationType,
  ThemeColor,
  window,
  workspace,
} from "vscode";
import { Target } from "../typings/target.types";
import { Graph, RangeWithEditor } from "../typings/Types";
import sleep from "../util/sleep";
import {
  getContentRange,
  runForEachEditor,
  runOnTargetsForEachEditor,
} from "../util/targetUtils";

export class EditStyle {
  name: EditStyleThemeColorName;
  token: TextEditorDecorationType;
  line: TextEditorDecorationType;

  constructor(colorName: EditStyleThemeColorName) {
    const options: DecorationRenderOptions = {
      backgroundColor: new ThemeColor(`cursorless.${colorName}`),
      rangeBehavior: DecorationRangeBehavior.ClosedClosed,
    };
    this.name = colorName;
    this.token = window.createTextEditorDecorationType(options);
    this.line = window.createTextEditorDecorationType({
      ...options,
      isWholeLine: true,
    });
  }

  getDecoration(isToken: boolean) {
    return isToken ? this.token : this.line;
  }

  dispose() {
    this.token.dispose();
    this.line.dispose();
  }
}

const EDIT_STYLE_NAMES = [
  "pendingDelete",
  "referenced",
  "pendingModification0",
  "pendingModification1",
  "justAdded",
  "highlight0",
  "highlight1",
] as const;

export type EditStyleName = typeof EDIT_STYLE_NAMES[number];
type EditStyleThemeColorName = `${EditStyleName}Background`;

export class EditStyles implements Record<EditStyleName, EditStyle> {
  pendingDelete!: EditStyle;
  referenced!: EditStyle;
  pendingModification0!: EditStyle;
  pendingModification1!: EditStyle;
  justAdded!: EditStyle;
  highlight0!: EditStyle;
  highlight1!: EditStyle;

  constructor(graph: Graph) {
    EDIT_STYLE_NAMES.forEach((editStyleName) => {
      this[editStyleName] = new EditStyle(`${editStyleName}Background`);
    });

    graph.extensionContext.subscriptions.push(this);
  }

  async displayPendingEditDecorations(
    targets: Target[],
    style: EditStyle,
    getRange: (target: Target) => Range | undefined = getContentRange,
    contentOnly: boolean = false
  ) {
    await this.setDecorations(targets, style, getRange, contentOnly);

    await decorationSleep();

    this.clearDecorations(style);
  }

  displayPendingEditDecorationsForTargets(
    targets: Target[],
    style: EditStyle,
    isToken: boolean
  ) {
    return this.displayPendingEditDecorationsForRanges(
      targets.map(({ editor, contentRange }) => ({
        editor,
        range: contentRange,
      })),
      style,
      isToken
    );
  }

  async displayPendingEditDecorationsForRanges(
    ranges: RangeWithEditor[],
    style: EditStyle,
    isToken: boolean
  ) {
    await runForEachEditor(
      ranges,
      (range) => range.editor,
      async (editor, ranges) => {
        this.setEditorDecorations(
          editor,
          style,
          isToken,
          ranges.map((range) => range.range)
        );
      }
    );

    await decorationSleep();

    await runForEachEditor(
      ranges,
      (range) => range.editor,
      async (editor) => {
        editor.setDecorations(style.getDecoration(isToken), []);
      }
    );
  }

  async setDecorations(
    targets: Target[],
    style: EditStyle,
    getRange: (target: Target) => Range | undefined = getContentRange,
    contentOnly: boolean = false
  ) {
    await runOnTargetsForEachEditor(targets, async (editor, targets) => {
      if (contentOnly) {
        this.setEditorDecorations(
          editor,
          style,
          true,
          targets.map(getRange).filter((range): range is Range => !!range)
        );
      } else {
        this.setEditorDecorations(
          editor,
          style,
          true,
          targets
            .filter((target) => !target.isLine)
            .map(getRange)
            .filter((range): range is Range => !!range)
        );
        this.setEditorDecorations(
          editor,
          style,
          false,
          targets
            .filter((target) => target.isLine)
            .map(getRange)
            .filter((range): range is Range => !!range)
        );
      }
    });
  }

  clearDecorations(style: EditStyle) {
    window.visibleTextEditors.map((editor) => {
      editor.setDecorations(style.token, []);
      editor.setDecorations(style.line, []);
    });
  }

  private setEditorDecorations(
    editor: TextEditor,
    style: EditStyle,
    isToken: boolean,
    ranges: Range[]
  ) {
    console.log(style.name, isToken);
    editor.setDecorations(style.getDecoration(isToken), ranges);
  }

  dispose() {
    EDIT_STYLE_NAMES.forEach((editStyleName) => {
      this[editStyleName].dispose();
    });
  }
}

const decorationSleep = () => sleep(getPendingEditDecorationTime());

const getPendingEditDecorationTime = () =>
  workspace
    .getConfiguration("cursorless")
    .get<number>("pendingEditDecorationTime")!;
