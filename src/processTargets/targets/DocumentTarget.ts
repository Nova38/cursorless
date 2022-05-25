import { Range } from "vscode";
import BaseTarget, {
  CloneWithParameters,
  CommonTargetParameters,
  extractCommonParameters,
} from "./BaseTarget";

export default class DocumentTarget extends BaseTarget {
  constructor(parameters: CommonTargetParameters) {
    super({
      ...extractCommonParameters(parameters),
      delimiter: "\n",
    });
  }

  get isLine() {
    return true;
  }

  getRemovalHighlightRange(): Range | undefined {
    if (this.position != null) {
      return undefined;
    }
    return this.contentRange;
  }

  protected getRemovalContentRange(): Range {
    if (this.position != null) {
      return this.contentRange;
    }
    return new Range(
      this.editor.document.lineAt(0).range.start,
      this.editor.document.lineAt(this.editor.document.lineCount - 1).range.end
    );
  }

  cloneWith(parameters: CloneWithParameters): DocumentTarget {
    return new DocumentTarget({ ...this.state, ...parameters });
  }
}
