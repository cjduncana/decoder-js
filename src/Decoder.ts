import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray';
import { Validation } from 'fp-ts/lib/Validation';

export default class Decoder<a> {
  public run(value: unknown): Decoded<a> {
    throw new Error('This method has to be implemented');
  }
}

export type Decoded<a> = Validation<NonEmptyArray<string>, a>;
