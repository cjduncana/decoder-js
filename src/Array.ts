import { nonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import * as ValidationFn from 'fp-ts/lib/Validation';

import Decoder, { Decoded } from './Decoder';

export default class ArrayD<a> extends Decoder<a[]> {
  private decoder: Decoder<a>;

  constructor(decoder: Decoder<a>) {
    super();
    this.decoder = decoder;
  }

  public run(valueArray: unknown): Decoded<a[]> {
    if (Array.isArray(valueArray)) {
      return valueArray.reduce((validated: Decoded<a[]>, nextValue: unknown, index: number): Decoded<a[]> => {
        const validatedValue = this.decoder.run(nextValue);

        return validatedValue.fold(
          (errorsFromValue) => {
            const errors = errorsFromValue.map((errorText) => `${errorText} at index #${index}`);

            return validated.fold(
              (errorsFromValidated) => ValidationFn.failure(errorsFromValidated.concat(errors)),
              () => ValidationFn.failure(errors),
            );
          },
          (successFromValue) => validated.map((successes) => [...successes, successFromValue]),
        );
      }, ValidationFn.success([]));
    }

    const message = `Value must be an array, found "${typeof valueArray}" instead`;
    return ValidationFn.failure(nonEmptyArray.of(message));
  }
}
