import { Target } from "../typings/target.types";
import { Graph } from "../typings/Types";
import { setSelectionsAndFocusEditor } from "../util/setSelectionsAndFocusEditor";
import { ensureSingleEditor } from "../util/targetUtils";
import { Action, ActionReturnValue } from "./actions.types";

export default class Clear implements Action {
  constructor(private graph: Graph) {
    this.run = this.run.bind(this);
  }

  async run([targets]: [Target[]]): Promise<ActionReturnValue> {
    const editor = ensureSingleEditor(targets);

    const { thatMark } = await this.graph.actions.remove.run([targets], {
      showDecorations: true,
      contentOnly: true,
    });

    if (thatMark != null) {
      await setSelectionsAndFocusEditor(
        editor,
        thatMark.map(({ selection }) => selection)
      );
    }

    return { thatMark };
  }
}