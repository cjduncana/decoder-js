import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class Succeed<a> extends Decoder<a> {
  private value: a;

  constructor(value: a) {
    super();
    this.value = value;
  }

  public run(): Decoded<a> {
    return ValidationFn.success(this.value);
  }
}
