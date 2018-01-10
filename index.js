const fs = require('fs');
const google = require('googleapis')

require('dotenv').config();

const API_VERSION = 'v1';
const DISCOVERY_API = 'https://cloudiot.googleapis.com/$discovery/rest';

// cb removed as a parameter
function getClient() {
  const serviceAccount = JSON.parse(fs.readFileSync('./service-account-test.json'));
  const jwtAccess = new google.auth.JWT();
  jwtAccess.fromJSON(serviceAccount);
  // Note that if you require additional scopes, they should be specified as a
  // string, separated by spaces.
  jwtAccess.scopes = 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/cloudiot';
  // Set the default authentication to the above JWT access.
  google.options({ auth: jwtAccess });

  const discoveryUrl = `${DISCOVERY_API}?version=${API_VERSION}`;

  google.discoverAPI(discoveryUrl, {}, (err, client) => {
    if (err) {
      console.log('Error during API discovery', err);
      return undefined;
    }
    console.log('Success!')
    // cb();
    const cloudRegion = process.env.CLOUD_REGION;
    const projectId = process.env.PROJECT_ID;
    const registryId = process.env.REGISTRY_ID;
    const deviceId = process.env.DEVICE_ID;
    // This is the latest version of the configuration
    const version = 3;
    // This is the data that will be used to setDeviceConfig
    const data = '{"hello": "world"}'
    lookupRegistry({client, registryId, projectId, cloudRegion});
    listDevices({client, registryId, projectId, cloudRegion})
    getDeviceState({client, deviceId, registryId, projectId, cloudRegion})
    setDeviceConfig({client, deviceId, registryId, projectId, cloudRegion, data, version})
  });
}


// Lookup the registry, assuming that it exists.
function lookupRegistry({client, registryId, projectId, cloudRegion}) {
  // [START iot_lookup_registry]
  // Client retrieved in callback
  // getClient(serviceAccountJson, function(client) {...});
  const parentName = `projects/${projectId}/locations/${cloudRegion}`;
  const registryName = `${parentName}/registries/${registryId}`;
  const request = {
    name: registryName
  };

  client.projects.locations.registries.get(request, (err, data) => {
    if (err) {
      console.log('Could not look up registry');
      console.log(err);
    } else {
      console.log('Looked up existing registry');
      console.log(data);
    }
  });
  // [END iot_lookup_registry]
}

function listDevices({client, registryId, projectId, cloudRegion}) {
  // [START iot_list_devices]
  // Client retrieved in callback
  const parentName = `projects/${projectId}/locations/${cloudRegion}`;
  const registryName = `${parentName}/registries/${registryId}`;

  const request = {
    parent: registryName
  };

  client.projects.locations.registries.devices.list(request, (err, data) => {
    if (err) {
      console.log('Could not list devices');
      console.log(err);
    } else {
      console.log('Current devices in registry:', data['devices']);
    }
  });
  // [END iot_list_devices]
}

function getDeviceState ({client, deviceId, registryId, projectId, cloudRegion}) {
  const parentName = `projects/${projectId}/locations/${cloudRegion}`;
  const registryName = `${parentName}/registries/${registryId}`;
  const request = {
    name: `${registryName}/devices/${deviceId}`
  };

  client.projects.locations.registries.devices.states.list(request,
      (err, data) => {
        if (err) {
          console.log('Could not find device:', deviceId);
          console.log(err);
        } else {
          console.log('State:', data);
        }
      });
  // [END iot_get_device_state]
}

// What would happen to a device you post config to if it is not set up to receive that
// config?
function setDeviceConfig({client,
  deviceId,
  registryId,
  projectId,
  cloudRegion,
  data,
  version}) {
  const parentName = `projects/${projectId}/locations/${cloudRegion}`;
  const registryName = `${parentName}/registries/${registryId}`;
  const binaryData = Buffer.from(data).toString('base64');
  const request = {
    name: `${registryName}/devices/${deviceId}`,
    versionToUpdate: version,
    binaryData: binaryData
  }

  client.projects.locations.registries.devices.modifyCloudToDeviceConfig(request,
      (err, data) => {
        if (err) {
          console.log('Could not update config:', deviceId);
          console.log('Message: ', err);
        } else {
          console.log('Success :', data);
        }
      });
}

getClient()
