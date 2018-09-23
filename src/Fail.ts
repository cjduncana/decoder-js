import { nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class Fail<a> extends Decoder<a> {
  private message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }

  public run(): Decoded<a> {
    return ValidationFn.failure(nonEmptyArray.of(this.message));
  }
}
