import Decoder from 'decoder-js';

export default class Uuid {
  private static isValid(str: string) {
    const validRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return validRegex.test(str);
  }

  private value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public static get decoder() {
    return Decoder.andThen((value) => {
      if (Uuid.isValid(value)) {
        return Decoder.succeed(new Uuid(value));
      }

      return Decoder.fail<Uuid>(`"${value}" is not a valid Uuid value`);
    }, Decoder.string());
  }
}
