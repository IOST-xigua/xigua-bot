const request = require('async-request');

const IOST = require('iost')
const bs58 = require('bs58');

const providerAddress = process.env.PROVIDER_ADDRESS;

// use RPC
const rpc = new IOST.RPC(new IOST.HTTPProvider(providerAddress));

// init iost sdk
let iost = new IOST.IOST({ // will use default setting if not set
    gasRatio: 1,
    gasLimit: 1000000,
    delay:0,
}, new IOST.HTTPProvider(providerAddress));

const account = new IOST.Account(process.env.IOST_ACCOUNT);
const kp = new IOST.KeyPair(bs58.decode(process.env.IOST_PRIVATE_KEY));

account.addKeyPair(kp, "owner");
account.addKeyPair(kp, "active");

const oracleAddress = "Contract31zSoLKV2hgYHA7z2hvnnzPEtQKmUrkAPKQ5tTmQcepw";

const uploadHuobiPrice = async () => {
  const url = 'https://api.huobi.pro/market/history/trade?symbol=iostusdt&size=1';
  const res = await request(url);

  if (res.statusCode == 200 && res.body) {
    const data = JSON.parse(res.body);
    const price = data.data[0].data[0].price;

    const tx = iost.callABI(oracleAddress,
        "setPrice",
        ["huobi", price.toString()]);
    account.signTx(tx);
    const handler = new IOST.TxHandler(tx, rpc);

    handler.onFailed(console.log).send();

    const now = Math.floor(new Date().getTime() / 1000);
    console.log(now, price);
  }
}

setInterval(() => {
  uploadHuobiPrice();
}, 60000);

uploadHuobiPrice();
