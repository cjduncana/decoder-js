import Decoder from 'decoder-js';

import Uuid from './Uuid';

export default class Cause {

  private static construct(uuid: Uuid, name: string, deathRate: number) {
    return new Cause(uuid, name, deathRate);
  }

  private uuid: Uuid;
  private name: string;
  private deathRate: number;

  constructor(uuid: Uuid, name: string, deathRate: number) {
    this.uuid = uuid;
    this.name = name;
    this.deathRate = deathRate;
  }

  public static get decoder() {
    return Decoder.map3(
      Cause.construct,
      Decoder.index(1, Uuid.decoder),
      Decoder.index(9, Decoder.string()),
      Decoder.index(10, decoderNumberFromString),
    );
  }
}

const decoderNumberFromString = Decoder.andThen((possibleNumber) => {
  const numberParsed = Number(possibleNumber);

  if (isNaN(numberParsed)) {
    return Decoder.fail<number>('Expected a number');
  }

  return Decoder.succeed(numberParsed);
}, Decoder.string());
