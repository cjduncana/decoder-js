import Decoder, { Decoded } from './Decoder';

export default class Map<a, b> extends Decoder<b> {
  private fn: (value: a) => b;
  private decoder: Decoder<a>;

  constructor(fn: (value: a) => b, decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
    this.fn = fn;
  }

  public run(value: unknown): Decoded<b> {
    return this.decoder.run(value).map(this.fn);
  }
}
