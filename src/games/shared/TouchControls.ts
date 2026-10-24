type Input = {
  forward: number;
  strafe: number;
  turn: number;
  interact: boolean;
};
type Press = { axis: keyof Input; value: number | boolean };
/** Keep each held finger independent, including cancellation and capture loss. */
export class TouchControls {
  private pointers = new Map<number, Press>();
  press(id: number, axis: keyof Input, value: number | boolean): Input {
    this.pointers.set(id, { axis, value });
    return this.read();
  }
  release(id: number): Input {
    this.pointers.delete(id);
    return this.read();
  }
  clear(): Input {
    this.pointers.clear();
    return this.read();
  }
  private read(): Input {
    const input: Input = { forward: 0, strafe: 0, turn: 0, interact: false };
    for (const { axis, value } of this.pointers.values()) {
      if (axis === "interact") input.interact ||= Boolean(value);
      else input[axis] += Number(value);
    }
    for (const axis of ["forward", "strafe", "turn"] as const)
      input[axis] = Math.max(-1, Math.min(1, input[axis]));
    return input;
  }
}
