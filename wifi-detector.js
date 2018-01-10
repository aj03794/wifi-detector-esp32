const wifiScanner = require('node-wifiscanner2');
const {exec} = require ('child_process')
const {argv} = require('process')

require('dotenv').config();

const networkInfo = () => {
  return new Promise((resolve, reject) => {
    wifiScanner.scan(function(err, data){
        if (err) {
          console.log("Error : " + err);
          reject(e);
        }
        data.map((wifiNetwork) => {
          if (wifiNetwork.ssid === 'Searching...' || wifiNetwork.ssid === 'PublicWiFi')
          // console.log(wifiNetwork)
          resolve(wifiNetwork)
        })
    });
  })
}

networkInfo()
  .then((result) => {
    if (result.ssid === 'Searching...') {
      const password = process.env.HOME_WIFI_PASSWORD
      launchEsp(result.ssid, password)
    } else {
      const password = process.env.WORK_WIFI_PASSWORD
      launchEsp(result.ssid, null)
    }
    console.log(result);
  })
  .catch((e) => {
    console.log(e)
  })


const launchEsp = (wifiName, password) => {
  exec(`mos wifi ${wifiName} ${password} && mos --port /dev/cu.SLAB_USBtoUART && mos ui`, (err, stdout, stderr) => {
    if (err) return console.log(err);
  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
  })
}
