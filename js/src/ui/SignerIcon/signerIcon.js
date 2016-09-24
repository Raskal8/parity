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
import { keccak_256 } from 'js-sha3'; // eslint-disable-line camelcase
import ActionFingerprint from 'material-ui/svg-icons/action/fingerprint';

import IdentityIcon from '../IdentityIcon';

export default class SignerIcon extends Component {
  static propTypes = {
    className: PropTypes.string
  }

  render () {
    const { className } = this.props;
    const signerToken = window.localStorage.getItem('sysuiToken');

    if (!signerToken) {
      return (
        <ActionFingerprint />
      );
    }

    const signerSha = keccak_256(signerToken);

    return (
      <IdentityIcon
        center
        className={ className }
        address={ signerSha } />
    );
  }
}