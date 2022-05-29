import { TextEditor } from "vscode";
import { EditNewContext, Target, TargetType } from "../../typings/target.types";
import { getNotebookFromCellDocument } from "../../util/notebook";
import { createContinuousRange } from "../targetUtil/createContinuousRange";
import BaseTarget, {
  CloneWithParameters,
  CommonTargetParameters,
} from "./BaseTarget";
import { createContinuousRangeWeakTarget } from "./WeakTarget";

export default class NotebookCellTarget extends BaseTarget {
  constructor(parameters: CommonTargetParameters) {
    super(parameters);
  }

  get type(): TargetType {
    return "notebookCell";
  }
  get delimiter() {
    return "\n";
  }
  getLeadingDelimiterRange() {
    return undefined;
  }
  getTrailingDelimiterRange() {
    return undefined;
  }

  getEditNewContext(isBefore: boolean): EditNewContext {
    if (this.isNotebookEditor(this.editor)) {
      return {
        type: "command",
        dontUpdateSelection: true,
        command: isBefore
          ? "notebook.cell.insertCodeCellAbove"
          : "notebook.cell.insertCodeCellBelow",
      };
    }
    return {
      type: "command",
      dontUpdateSelection: true,
      command: isBefore ? "jupyter.insertCellAbove" : "jupyter.insertCellBelow",
    };
  }

  cloneWith(parameters: CloneWithParameters) {
    return new NotebookCellTarget({
      ...this.getCloneParameters(),
      ...parameters,
    });
  }

  createContinuousRangeTarget(
    isReversed: boolean,
    endTarget: Target,
    includeStart: boolean,
    includeEnd: boolean
  ): Target {
    if (this.isSameType(endTarget)) {
      return new NotebookCellTarget({
        ...this.getCloneParameters(),
        isReversed,
        contentRange: createContinuousRange(
          this,
          endTarget,
          includeStart,
          includeEnd
        ),
      });
    }

    return createContinuousRangeWeakTarget(
      isReversed,
      this,
      endTarget,
      includeStart,
      includeEnd
    );
  }

  protected getCloneParameters() {
    return this.state;
  }

  private isNotebookEditor(editor: TextEditor) {
    return getNotebookFromCellDocument(editor.document) != null;
  }
}
