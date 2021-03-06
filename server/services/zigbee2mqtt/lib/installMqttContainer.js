const cloneDeep = require('lodash.clonedeep');
const { promisify } = require('util');
const { exec } = require('../../../utils/childProcess');
const { CONFIGURATION } = require('./constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const containerDescriptor = require('../docker/gladys-z2m-mqtt-container.json');
const logger = require('../../../utils/logger');

const sleep = promisify(setTimeout);

/**
 * @description Install and starts MQTT container.
 * @example
 * installMqttContainer();
 */
async function installMqttContainer() {
  let dockerContainers = await this.gladys.system.getContainers({
    all: true,
    filters: { name: [containerDescriptor.name] },
  });
  let [container] = dockerContainers;

  if (dockerContainers.length === 0) {
    let containerMqtt;
    try {
      logger.info('MQTT broker is being installed as Docker container...');
      logger.info(`Pulling ${containerDescriptor.Image} image...`);
      await this.gladys.system.pull(containerDescriptor.Image);

      // Prepare broker env
      logger.info(`Preparing broker environment...`);
      const containerDescriptorToMutate = cloneDeep(containerDescriptor);
      const { basePathOnContainer, basePathOnHost } = await this.gladys.system.getGladysBasePath();
      const brokerEnv = await exec(`sh ./services/zigbee2mqtt/docker/gladys-z2m-mqtt-env.sh ${basePathOnContainer}`);
      logger.trace(brokerEnv);
      containerDescriptorToMutate.HostConfig.Binds.push(`${basePathOnHost}/zigbee2mqtt/mqtt:/mosquitto/config`);

      logger.info(`Creating container with data in "${basePathOnHost}" on host...`);
      containerMqtt = await this.gladys.system.createContainer(containerDescriptorToMutate);
      logger.trace(containerMqtt);
      this.mqttExist = true;
    } catch (e) {
      logger.error('MQTT broker failed to install as Docker container:', e);
      this.mqttExist = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }

    try {
      logger.info('MQTT broker is restarting...');
      await this.gladys.system.restartContainer(containerMqtt.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);

      // Copy password in broker container
      logger.info(`Creating user/pass...`);
      const z2mMqttUser = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_USERNAME_KEY, this.serviceId);
      const z2mMqttPass = await this.gladys.variable.getValue(CONFIGURATION.Z2M_MQTT_PASSWORD_KEY, this.serviceId);
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', z2mMqttUser, z2mMqttPass],
      });
      const mqttUser = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, this.serviceId);
      const mqttPass = await this.gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, this.serviceId);
      await this.gladys.system.exec(containerMqtt.id, {
        Cmd: ['mosquitto_passwd', '-b', '/mosquitto/config/mosquitto.passwd', mqttUser, mqttPass],
      });

      // Container restart to inintialize users configuration
      logger.info('MQTT broker is restarting...');
      await this.gladys.system.restartContainer(containerMqtt.id);
      // wait 5 seconds for the container to restart
      await sleep(5 * 1000);
      logger.info('MQTT broker container successfully started and configured');

      this.mqttRunning = true;
      this.mqttExist = true;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }
  } else {
    this.mqttExist = true;
    try {
      dockerContainers = await this.gladys.system.getContainers({
        all: true,
        filters: { name: [containerDescriptor.name] },
      });
      [container] = dockerContainers;
      if (container.state !== 'running') {
        logger.info('MQTT broker is starting...');
        await this.gladys.system.restartContainer(container.id);
        // wait 5 seconds for the container to restart
        await sleep(5 * 1000);
      }

      logger.info('MQTT broker container successfully started');
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      this.mqttRunning = true;
      this.mqttExist = true;
    } catch (e) {
      logger.error('MQTT broker container failed to start:', e);
      this.mqttRunning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      });
      throw e;
    }
  }
}

module.exports = {
  installMqttContainer,
};
