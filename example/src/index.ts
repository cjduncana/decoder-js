/* tslint:disable:no-console */

import axios from 'axios';
import Decoder from 'decoder-js';
import Cause from './Cause';

axios.get('https://data.cdc.gov/api/views/6rkc-nb2q/rows.json')
  .then(({ data }) => {
    const causesResult = decoder.run(data);

    causesResult.fold(
      (failedMessages) => console.log(failedMessages.toArray().join(', ')),
      (causes) => console.log(causes),
    );
  })
  .catch(console.log);

const decoder = Decoder.field('data', Decoder.array(Cause.decoder));
