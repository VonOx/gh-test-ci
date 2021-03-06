import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import SelectDeviceFeature from '../../../../components/device/SelectDeviceFeature';

@connect('httpClient', {})
class TurnOnLight extends Component {
  onDeviceFeatureChange = deviceFeature => {
    this.setState({ selectedDeviceFeature: deviceFeature });
    if (deviceFeature) {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', deviceFeature.selector);
      if (deviceFeature.selector !== this.props.trigger.device_feature) {
        this.props.updateTriggerProperty(this.props.index, 'value', null);
      }
    } else {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', null);
    }
    if (deviceFeature && deviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
      this.props.updateTriggerProperty(this.props.index, 'operator', '=');
    }
    if (deviceFeature && deviceFeature.category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR) {
      this.props.updateTriggerProperty(this.props.index, 'operator', '=');
      this.props.updateTriggerProperty(this.props.index, 'value', 1);
      this.props.updateTriggerProperty(this.props.index, 'threshold_only', false);
    }
  };
  handleOperatorChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'operator', e.target.value);
  };
  handleValueChange = e => {
    let value = e.target.value;
    if (value.includes(',')) {
      value = value.replaceAll(',', '.');
    }
    const lastCharacter = value.length > 0 ? value[value.length - 1] : '';
    if (!isNaN(parseFloat(e.target.value)) && lastCharacter !== '.') {
      this.props.updateTriggerProperty(this.props.index, 'value', parseFloat(value));
    } else {
      this.props.updateTriggerProperty(this.props.index, 'value', value);
    }
  };
  handleValueChangeBinary = newValue => () => {
    this.props.updateTriggerProperty(this.props.index, 'value', newValue);
  };
  handleThresholdOnlyModeChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'threshold_only', e.target.checked);
  };
  getBinaryOperator = () => (
    <div class="col-2">
      <div class="text-center" style={{ marginTop: '10px' }}>
        <i class="fe fe-arrow-right" style={{ fontSize: '20px' }} />
      </div>
    </div>
  );
  getBinaryButtons = () => (
    <div class="col-4">
      <div class="form-group">
        <div class="row">
          <div class="col-6">
            <button
              class={cx('btn btn-block', {
                'btn-primary': this.props.trigger.value === 1,
                'btn-outline-primary': this.props.trigger.value !== 1,
                active: this.props.trigger.value === 1
              })}
              onClick={this.handleValueChangeBinary(1)}
            >
              <Text id="editScene.triggersCard.newState.on" />
            </button>
          </div>
          <div class="col-6">
            <button
              class={cx('btn btn-block', {
                'btn-primary': this.props.trigger.value === 0,
                'btn-outline-primary': this.props.trigger.value !== 0,
                active: this.props.trigger.value === 0
              })}
              onClick={this.handleValueChangeBinary(0)}
            >
              <Text id="editScene.triggersCard.newState.off" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  getPresenceSensor = () => (
    <div class="col-6">
      <button class="btn btn-block btn-secondary" disabled>
        <Text id="editScene.triggersCard.newState.deviceSeen" />
      </button>
    </div>
  );

  render(props, { selectedDeviceFeature }) {
    return (
      <div>
        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <SelectDeviceFeature
                value={this.props.trigger.device_feature}
                onDeviceFeatureChange={this.onDeviceFeatureChange}
              />
            </div>
          </div>
          {selectedDeviceFeature &&
            selectedDeviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY &&
            this.getBinaryOperator()}
          {selectedDeviceFeature &&
            selectedDeviceFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY &&
            this.getBinaryButtons()}
          {selectedDeviceFeature &&
            selectedDeviceFeature.category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR &&
            this.getPresenceSensor()}
          {selectedDeviceFeature &&
            selectedDeviceFeature.type !== DEVICE_FEATURE_TYPES.SWITCH.BINARY &&
            selectedDeviceFeature.category !== DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR && (
              <div class="col-3">
                <div class="form-group">
                  <select class="form-control" onChange={this.handleOperatorChange} value={props.trigger.operator}>
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    <option value="=">
                      <Text id="editScene.triggersCard.newState.equal" />
                    </option>
                    <option value=">=">
                      <Text id="editScene.triggersCard.newState.superiorOrEqual" />
                    </option>
                    <option value=">">
                      <Text id="editScene.triggersCard.newState.superior" />
                    </option>
                    <option value="!=">
                      <Text id="editScene.triggersCard.newState.different" />
                    </option>
                    <option value="<=">
                      <Text id="editScene.triggersCard.newState.lessOrEqual" />
                    </option>
                    <option value="<">
                      <Text id="editScene.triggersCard.newState.less" />
                    </option>
                  </select>
                </div>
              </div>
            )}
          {selectedDeviceFeature &&
            selectedDeviceFeature.type !== DEVICE_FEATURE_TYPES.SWITCH.BINARY &&
            selectedDeviceFeature.category !== DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR && (
              <div class="col-3">
                <div class="form-group">
                  <div class="input-group">
                    <Localizer>
                      <input
                        type="text"
                        class="form-control"
                        placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                        value={props.trigger.value}
                        onChange={this.handleValueChange}
                      />
                    </Localizer>
                    {selectedDeviceFeature.unit && (
                      <span class="input-group-append" id="basic-addon2">
                        <span class="input-group-text">
                          <Text id={`deviceFeatureUnitShort.${selectedDeviceFeature.unit}`} />
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          {selectedDeviceFeature && selectedDeviceFeature.category !== DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR && (
            <div class="col-12">
              <label class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  checked={props.trigger.threshold_only}
                  onChange={this.handleThresholdOnlyModeChange}
                />
                <span class="form-check-label">
                  <Text id="editScene.triggersCard.newState.onlyExecuteAtThreshold" />
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TurnOnLight;
