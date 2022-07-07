// Run command:  docker run --rm -i grafana/k6 run - < script.js
import http from 'k6/http';
import { check, sleep } from 'k6';
// These are still very much WIP and untested, but you can use them as is or write your own!
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js";

export const options = {
  thresholds: {

    http_req_failed: ['rate<0.01'], // http errors should be less than 1%

    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2000ms

  },
  stages: [
    { duration: '1m', target: 100 }, // below normal load
    { duration: '2m', target: 100 }, // below normal load
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 }, // normal load
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 }, // around the breaking point
    { duration: '5m', target: 300 },
    { duration: '2m', target: 400 }, // beyond the breaking point
    { duration: '5m', target: 400 },
    { duration: '10m', target: 0 }, // scale down. Recovery stage.
  ],
};

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },

  };



  const url = "https://subgraph.sovryn.app/subgraphs/name/DistributedCollective/sovryn-subgraph"
  let dates = getDates()
  let fromDate = dates.fromDate
  let toDate = dates.toDate
  const payload1 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  dates = getDates()
  fromDate = dates.fromDate
  toDate = dates.toDate
  const payload2 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  dates = getDates()
  fromDate = dates.fromDate
  toDate = dates.toDate
  const payload3 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  dates = getDates()
  fromDate = dates.fromDate
  toDate = dates.toDate
  const payload4 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  dates = getDates()
  fromDate = dates.fromDate
  toDate = dates.toDate
  const payload5 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  dates = getDates()
  fromDate = dates.fromDate
  toDate = dates.toDate
  const payload6 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  dates = getDates()
  fromDate = dates.fromDate
  toDate = dates.toDate
  const payload7 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  dates = getDates()
  fromDate = dates.fromDate
  toDate = dates.toDate
  const payload8 = `{\"variables\":{},\"query\":\"{\\n  candleSticks(\\n    where: {baseToken: \\\"0x542fda317318ebf1d3deaf76e0b632741a7e677d\\\", quoteToken: \\\"0xb5999795be0ebb5bab23144aa5fd6a02d080299f\\\", interval: \\\"FifteenMinutesInterval\\\", periodStartUnix_gte: ${fromDate}, periodStartUnix_lte: ${toDate}}\\n    orderBy: periodStartUnix\\n    orderDirection: desc\\n    first: 75\\n  ) {\\n    id\\n    open\\n    high\\n    low\\n    close\\n    totalVolume\\n    periodStartUnix\\n    __typename\\n  }\\n}\\n\"}`

  const req1 = {
    method: 'POST',
    url,
    body: payload1,
    params
  };
  const req2 = {
    method: 'POST',
    url,
    body: payload2,
    params
  };
  const req3 = {
    method: 'POST',
    url,
    body: payload3,
    params
  };
  const req4 = {
    method: 'POST',
    url,
    body: payload4,
    params
  };
  const req5 = {
    method: 'POST',
    url,
    body: payload5,
    params
  };
  const req6 = {
    method: 'POST',
    url,
    body: payload6,
    params
  };
  const req7 = {
    method: 'POST',
    url,
    body: payload7,
    params
  };
  const req8 = {
    method: 'POST',
    url,
    body: payload8,
    params
  };

  const responses = http.batch([req1, req2, req3, req4, req5, req6, req7, req8]);

  check(responses[0], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
  check(responses[1], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
  check(responses[2], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
  check(responses[3], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
  check(responses[4], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
  check(responses[5], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
  check(responses[6], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
  check(responses[7], {
    'main page status was 200': (res) => res.status === 200,
    'response contains real values': (res) => res.json().data.candleSticks[0].totalVolume !== null
  })
}

const getDates = () => {
  let fromDate = getRandomDate()
  let toDate = new Date(fromDate)

  toDate = toDate.setDate(toDate.getDate() + 2);

  fromDate = Math.floor(fromDate.getTime() / 1000)
  toDate = Math.floor(toDate / 1000)
  return { fromDate, toDate }
}

const randomNumber = (maxLimit = 100) => {
  let rand = Math.random() * maxLimit;
  rand = Math.floor(rand); // 99
  return rand;
}

const getRandomDate = (range = 365) => {
  const date = new Date()
  date.setDate(date.getDate() - randomNumber(range));
  return date
}



export function handleSummary(data) {
  console.log('Preparing the end-of-test summary...');

  // Send the results to some remote server or trigger a hook

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }), // Show the text summary to stdout...
    // "./summary.html": htmlReport(data, { debug: true }), // generate an HTML report
    // And any other JS transformation of the data you can think of,
    // you can write your own JS helpers to transform the summary data however you like!
  };
}
