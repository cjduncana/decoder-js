/* tslint:disable:no-console */

import Decoder, { Decoded } from 'decoder-js';
import fetch from 'node-fetch';
import Cause from './Cause';

fetch('https://data.cdc.gov/api/views/6rkc-nb2q/rows.json')
  .then((response) => response.json())
  .then((data) => {
    const causesResult: Decoded<Cause[]> = decoder.run(data);

    causesResult.fold(
      (failedMessages) => console.log(failedMessages.toArray().join(', ')),
      (causes) => console.log(causes),
    );
  })
  .catch(console.log);

const decoder = Decoder.field('data', Decoder.array(Cause.decoder));
