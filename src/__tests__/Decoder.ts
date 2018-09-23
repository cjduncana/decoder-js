import Decoder from '../Decoder';

describe('Abstract Decoder', () => {

  test('should throw if still abstract', () => {
    const decoder = new Decoder();
    expect(() => decoder.run({})).toThrow();
  });
});
