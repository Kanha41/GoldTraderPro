const googleTTS = require('google-tts-api');
const fs = require('fs');

const text = "Welcome to the GoldTrader Challenge. In Stage 1, you must reach the profit target of 8 percent without exceeding the daily drawdown of 5 percent or the maximum drawdown of 10 percent. In Stage 2, the profit target is reduced to 5 percent, but the same strict risk management rules apply. Good luck on your path to becoming a funded trader.";

googleTTS.getAllAudioBase64(text, {
  lang: 'en',
  slow: false,
  host: 'https://translate.google.com',
  timeout: 10000,
}).then(results => {
  // results is an array of objects: { shortText: string, base64: string }
  const buffers = results.map(result => Buffer.from(result.base64, 'base64'));
  const fullBuffer = Buffer.concat(buffers);
  fs.writeFileSync('public/challenge-audio.mp3', fullBuffer);
  console.log('Audio file created successfully!');
}).catch(console.error);
