import { nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class Field<a> extends Decoder<a> {
  private decoder: Decoder<a>;
  private field: string;

  constructor(field: string, decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
    this.field = field;
  }

  public run(valueObject: unknown): Decoded<a> {
    if (isObject(valueObject)) {

      if (this.field in valueObject) {
        return this.decoder.run(valueObject[this.field]).mapFailure(
          (errors) => errors.map((error) => `${error} at key "${this.field}"`),
        );
      }

      const noFieldMsg = `Object missing value at key "${this.field}"`;
      return ValidationFn.failure(nonEmptyArray.of(noFieldMsg));
    }

    const notObjectMsg = `Value must be a object, found "${typeof valueObject}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(notObjectMsg));
  }
}

function isObject(value: unknown): value is { [prop: string]: unknown } {
  return typeof value === 'object';
}
