import { Button } from '@codaco/ui';
import React from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
import { SettingsMenuButton } from '../../components/SettingsMenu';
import { actionCreators } from '../../ducks/modules/auth';

const Navigation = () => {
  const dispatch = useDispatch();
  const logout = () => {
    dispatch(actionCreators.logoutAction());
  };

  const { user: { username } } = useSelector((state) => state.auth);

  return (
    // eslint-disable-next-line @codaco/spellcheck/spell-checker
    <nav className="app-nav">
      <div style={{ paddingLeft: '2.4rem', display: 'flex' }}>
        <SettingsMenuButton />
      </div>
      <ul>
        <li>
          Logged in as
          {' '}
          <strong>
            {username}
          </strong>
        </li>
        <li><Button onClick={logout} size="small">Logout</Button></li>
      </ul>
    </nav>
  );
};

Navigation.defaultProps = {
};

Navigation.propTypes = {

};

const mapDispatchToProps = {

};

const mapStateToProps = (state) => ({
  activeSessionId: state.activeSessionId,
  sessions: state.sessions,

});

export default connect(mapStateToProps, mapDispatchToProps)(Navigation);
