export class SlotTakenError extends Error {
  constructor() {
    super("Slot was taken before the booking was created");
    this.name = "SlotTakenError";
  }
}
