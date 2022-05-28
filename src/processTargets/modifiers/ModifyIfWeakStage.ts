import { Modifier, Target } from "../../typings/target.types";
import { ProcessedTargetsContext } from "../../typings/Types";
import getModifierStage from "../getModifierStage";
import { ModifierStage } from "../PipelineStages.types";

export default class implements ModifierStage {
  private nestedStage_?: ModifierStage;

  constructor(private nestedModifier: Modifier) {}

  private get nestedStage() {
    if (this.nestedStage_ == null) {
      this.nestedStage_ = getModifierStage(this.nestedModifier);
    }

    return this.nestedStage_;
  }

  run(context: ProcessedTargetsContext, target: Target): Target[] {
    if (target.isWeak) {
      return this.nestedStage
        .run(context, target)
        .map((newTarget) => newTarget.withThatTarget(target));
    }
    return [target];
  }
}