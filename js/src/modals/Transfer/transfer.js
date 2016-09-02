import BigNumber from 'bignumber.js';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FlatButton } from 'material-ui';
import ActionDoneAll from 'material-ui/svg-icons/action/done-all';
import ContentClear from 'material-ui/svg-icons/content/clear';
import ContentSend from 'material-ui/svg-icons/content/send';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';

import { newError } from '../../ui/Errors';
import { IdentityIcon, Modal } from '../../ui';

import Complete from './Complete';
import Details from './Details';
import Extras from './Extras';
import ERRORS from './errors';
import styles from './style.css';

const DEFAULT_GAS = '21000';
const DEFAULT_GASPRICE = '20000000000';
const TITLES = {
  transfer: 'transfer details',
  complete: 'complete',
  extras: 'extra information'
};
const STAGES_BASIC = [TITLES.transfer, TITLES.complete];
const STAGES_EXTRA = [TITLES.transfer, TITLES.extras, TITLES.complete];

class Transfer extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  }

  static propTypes = {
    account: PropTypes.object,
    onClose: PropTypes.func,
    onNewError: PropTypes.func
  }

  state = {
    stage: 0,
    data: '',
    dataError: null,
    extras: false,
    gas: DEFAULT_GAS,
    gasEst: '0',
    gasError: null,
    gasPrice: DEFAULT_GASPRICE,
    gasPriceError: null,
    recipient: '',
    recipientError: ERRORS.requireRecipient,
    sending: false,
    tag: 'ΞTH',
    total: '0.0',
    totalError: null,
    value: '0.0',
    valueAll: false,
    valueError: null,
    isEth: true
  }

  componentDidMount () {
    this.getDefaults();
  }

  render () {
    return (
      <Modal
        actions={ this.renderDialogActions() }
        current={ this.state.stage }
        steps={ this.state.extras ? STAGES_EXTRA : STAGES_BASIC }
        title={ this.renderAccount() }
        visible>
        { this.renderPage() }
      </Modal>
    );
  }

  renderAccount () {
    const { account } = this.props;

    return (
      <div className={ styles.hdraccount }>
        <div className={ styles.hdrimage }>
          <IdentityIcon
            inline center
            address={ account.address } />
        </div>
        <div className={ styles.hdrdetails }>
          <div className={ styles.hdrname }>
            { account.name || 'Unnamed' }
          </div>
          <div className={ styles.hdraddress }>
            { account.address }
          </div>
        </div>
      </div>
    );
  }

  renderPage () {
    if (this.state.stage === 0) {
      return this.renderDetailsPage();
    } else if (this.state.stage === 1 && this.state.extras) {
      return this.renderExtrasPage();
    }

    return this.renderCompletePage();
  }

  renderCompletePage () {
    return (
      <Complete
        sending={ this.state.sending }
        txhash={ this.state.txhash } />
    );
  }

  renderDetailsPage () {
    return (
      <Details
        address={ this.props.account.address }
        all={ this.state.valueAll }
        extras={ this.state.extras }
        recipient={ this.state.recipient }
        recipientError={ this.state.recipientError }
        tag={ this.state.tag }
        total={ this.state.total }
        totalError={ this.state.totalError }
        value={ this.state.value }
        valueError={ this.state.valueError }
        onChange={ this.onUpdateDetails } />
    );
  }

  renderExtrasPage () {
    return (
      <Extras
        isEth={ this.state.isEth }
        data={ this.state.data }
        dataError={ this.state.dataError }
        gas={ this.state.gas }
        gasEst={ this.state.gasEst }
        gasError={ this.state.gasError }
        gasPrice={ this.state.gasPrice }
        gasPriceDefault={ this.state.gasPriceDefault }
        gasPriceError={ this.state.gasPriceError }
        total={ this.state.total }
        totalError={ this.state.totalError }
        onChange={ this.onUpdateDetails } />
    );
  }

  renderDialogActions () {
    const cancelBtn = (
      <FlatButton
        icon={ <ContentClear /> }
        label='Cancel' primary
        onTouchTap={ this.onClose } />
    );
    const nextBtn = (
      <FlatButton
        disabled={ !this.isValid() }
        icon={ <NavigationArrowForward /> }
        label='Next' primary
        onTouchTap={ this.onNext } />
    );
    const prevBtn = (
      <FlatButton
        icon={ <NavigationArrowBack /> }
        label='Back' primary
        onTouchTap={ this.onPrev } />
    );
    const sendBtn = (
      <FlatButton
        disabled={ !this.isValid() || this.state.sending }
        icon={ <ContentSend /> }
        label='Send' primary
        onTouchTap={ this.onSend } />
    );
    const doneBtn = (
      <FlatButton
        icon={ <ActionDoneAll /> }
        label='Close' primary
        onTouchTap={ this.onClose } />
    );

    switch (this.state.stage) {
      case 0:
        return this.state.extras
          ? [cancelBtn, nextBtn]
          : [cancelBtn, sendBtn];
      case 1:
        return this.state.extras
          ? [cancelBtn, prevBtn, sendBtn]
          : [doneBtn];
      default:
        return [doneBtn];
    }
  }

  isValid () {
    const detailsValid = !this.state.recipientError && !this.state.valueError && !this.state.totalError;
    const extrasValid = !this.state.gasError && !this.state.gasPriceError && !this.state.totalError;
    const verifyValid = !this.state.passwordError;

    switch (this.state.stage) {
      case 0:
        return detailsValid;

      case 1:
        return this.state.extras ? extrasValid : verifyValid;

      case 2:
        return verifyValid;
    }
  }

  onNext = () => {
    this.setState({
      stage: this.state.stage + 1
    });
  }

  onPrev = () => {
    this.setState({
      stage: this.state.stage - 1
    });
  }

  _onUpdateAll (valueAll) {
    this.setState({
      valueAll
    }, this.recalculateGas);
  }

  _onUpdateExtras (extras) {
    this.setState({
      extras
    });
  }

  _onUpdateData (data) {
    this.setState({
      data
    }, this.recalculateGas);
  }

  validatePositiveNumber (num) {
    try {
      const v = new BigNumber(num);
      if (v.lt(0)) {
        return ERRORS.invalidAmount;
      }
    } catch (e) {
      return ERRORS.invalidAmount;
    }

    return null;
  }

  _onUpdateGas (gas) {
    const gasError = this.validatePositiveNumber(gas);

    this.setState({
      gas,
      gasError
    }, this.recalculate);
  }

  _onUpdateGasPrice (gasPrice) {
    const gasPriceError = this.validatePositiveNumber(gasPrice);

    this.setState({
      gasPrice,
      gasPriceError
    }, this.recalculate);
  }

  _onUpdateRecipient (recipient) {
    const { api } = this.context;
    let recipientError = null;

    if (!recipient || !recipient.length) {
      recipientError = ERRORS.requireRecipient;
    } else if (!api.format.isAddressValid(recipient)) {
      recipientError = ERRORS.invalidAddress;
    }

    this.setState({
      recipient,
      recipientError
    }, this.recalculateGas);
  }

  _onUpdateTag (tag) {
    this.setState({
      tag,
      isEth: tag === this.props.account.balances[0].token.tag
    }, this.recalculateGas);
  }

  _onUpdateValue (value) {
    const valueError = this.validatePositiveNumber(value);

    this.setState({
      value,
      valueError
    }, this.recalculateGas);
  }

  onUpdateDetails = (type, value) => {
    switch (type) {
      case 'all':
        return this._onUpdateAll(value);

      case 'extras':
        return this._onUpdateExtras(value);

      case 'data':
        return this._onUpdateData(value);

      case 'gas':
        return this._onUpdateGas(value);

      case 'gasPrice':
        return this._onUpdateGasPrice(value);

      case 'recipient':
        return this._onUpdateRecipient(value);

      case 'tag':
        return this._onUpdateTag(value);

      case 'value':
        return this._onUpdateValue(value);
    }
  }

  _sendEth () {
    const { api } = this.context;
    const { account } = this.props;
    const { data, gas, gasPrice, recipient, value } = this.state;
    const options = {
      from: account.address,
      to: recipient,
      gas,
      gasPrice,
      value: api.format.toWei(value || 0)
    };

    if (data && data.length) {
      options.data = data;
    }

    return this.context.api.eth.postTransaction(options);
  }

  _sendToken () {
    const { account } = this.props;
    const { recipient, value, tag } = this.state;
    const token = account.balances.find((balance) => balance.token.tag === tag).token;

    return token.contract.instance.transfer
      .postTransaction({
        from: account.address,
        to: token.address
      }, [
        recipient,
        new BigNumber(value).mul(token.format).toString()
      ]);
  }

  onSend = () => {
    this.onNext();

    this.setState({ sending: true }, () => {
      (this.state.isEth
        ? this._sendEth()
        : this._sendToken()
      ).then((txhash) => {
        this.setState({
          sending: false,
          txhash
        });
      })
      .catch((error) => {
        console.log('send', error);

        this.setState({
          sending: false
        });

        this.newError(error);
      });
    });
  }

  onClose = () => {
    this.setState({ stage: 0 }, () => {
      this.props.onClose && this.props.onClose();
    });
  }

  _estimateGasToken () {
    const { account } = this.props;
    const { recipient, value } = this.state;
    const token = account.balances.find((balance) => balance.token.tag === this.state.tag).token;

    return token.contract.instance.transfer
      .estimateGas({
        from: account.address,
        to: token.address
      }, [
        recipient,
        new BigNumber(value || 0).mul(token.format).toString()
      ]);
  }

  _estimateGasEth () {
    const { api } = this.context;
    const { account } = this.props;
    const { data, gas, gasPrice, recipient, value } = this.state;
    const options = {
      from: account.address,
      to: recipient,
      gas,
      gasPrice,
      value: api.format.toWei(value || 0)
    };

    if (data && data.length) {
      options.data = data;
    }

    return this.context.api.eth.estimateGas(options);
  }

  recalculateGas = () => {
    (this.state.isEth
      ? this._estimateGasEth()
      : this._estimateGasToken()
    ).then((_value) => {
      let gas = _value;

      if (gas.gt(DEFAULT_GAS)) {
        gas = gas.mul(1.2);
      }

      this.setState({
        gas: gas.toFixed(0),
        gasEst: _value.toFormat()
      }, this.recalculate);
    })
    .catch((error) => {
      console.error('etimateGas', error);
    });
  }

  recalculate = () => {
    const { api } = this.context;
    const { account } = this.props;

    if (!account) {
      return;
    }

    const { gas, gasPrice, tag, valueAll, isEth } = this.state;
    const gasTotal = new BigNumber(gasPrice || 0).mul(new BigNumber(gas || 0));
    const balances = account.balances;
    const balance = balances.find((balance) => tag === balance.token.tag);
    const availableEth = new BigNumber(balances[0].value);
    const available = new BigNumber(balance.value);
    const format = new BigNumber(balance.token.format || 1);

    let { value, valueError } = this.state;
    let totalEth = gasTotal;
    let totalError = null;

    if (valueAll) {
      if (isEth) {
        const bn = api.format.fromWei(availableEth.minus(gasTotal));
        value = (bn.lt(0) ? new BigNumber(0.0) : bn).toString();
      } else {
        value = available.div(format).toString();
      }
    }

    if (isEth) {
      totalEth = totalEth.plus(api.format.toWei(value || 0));
    }

    if (new BigNumber(value || 0).gt(available.div(format))) {
      valueError = ERRORS.largeAmount;
    } else if (valueError === ERRORS.largeAmount) {
      valueError = null;
    }

    if (totalEth.gt(availableEth)) {
      totalError = ERRORS.largeAmount;
    }

    this.setState({
      total: api.format.fromWei(totalEth).toString(),
      totalError,
      value,
      valueError
    });
  }

  getDefaults = () => {
    const api = this.context.api;

    api.eth
      .gasPrice()
      .then((gasPrice) => {
        this.setState({
          gasPrice: gasPrice.toString(),
          gasPriceDefault: gasPrice.toFormat()
        }, this.recalculate);
      })
      .catch((error) => {
        console.error('getDefaults', error);
      });
  }

  newError = (error) => {
    this.props.onNewError(error);
  }
}

function mapStateToProps (state) {
  return {};
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    onNewError: newError
  }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Transfer);