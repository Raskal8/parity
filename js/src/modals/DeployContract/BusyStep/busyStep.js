// Copyright 2015, 2016 Ethcore (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { Component, PropTypes } from 'react';

import styles from '../deployContract.css';

export default class BusyStep extends Component {
  static propTypes = {
    deployState: PropTypes.string,
    showSigner: PropTypes.bool
  }

  render () {
    const { deployState } = this.props;

    return (
      <div className={ styles.center }>
        <div>
          The deployment is currently in progress, { deployState }
        </div>
        { this.renderSigner() }
      </div>
    );
  }

  renderSigner () {
    const { showSigner } = this.props;

    if (!showSigner) {
      return null;
    }

    return (
      <div>
        Visit the Signer to <a href='/#/signer' target='_blank'>authenticate the transaction</a>.
      </div>
    );
  }
}
