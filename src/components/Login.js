import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text } from '@codaco/ui/lib/components/Fields';
import { Redirect } from 'react-router-dom';
import { Modal } from '@codaco/ui/lib/components/Modal';
import { Button } from '@codaco/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { actionCreators } from '../ducks/modules/auth';
import NCLogo from '../images/NC-Round.svg';

const Login = () => {
  const form = useRef();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { isLoggedIn, message } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  const onChangeUsername = (e) => {
    setUsername(e.target.value);
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = (e) => {
    e.preventDefault();

    setLoading(true);

    dispatch(actionCreators.loginThunk(username, password))
      .catch(() => {
        setLoading(false);
      });
  };

  if (isLoggedIn) {
    return <Redirect to="/start" />;
  }

  return (
    <Modal show>
      <motion.div className="login-box">
        <div className="login-box__header">
          <div className="logo">
            <img src={NCLogo} className="header-logo" alt="Network Canvas Interviewer" />
          </div>
          <div>
            <h1>Interviewer</h1>
            <h4>A tool for conducting Network Canvas Interviews.</h4>
          </div>
        </div>
        <div className="login-box__message">
          <AnimatePresence exitBeforeEnter>
            { message && message.length > 0 && (
            <motion.div
              key={message}
              className="login-message"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{
                duration: 0.2,
              }}
            >
              { message }
            </motion.div>
            )}
          </AnimatePresence>
        </div>
        <form onSubmit={handleLogin} ref={form} className="login-box__form">
          <div className="form-group">
            <Text
              label="Username"
              placeholder="Enter your username..."
              input={{
                value: username,
                name: 'username',
                onChange: onChangeUsername,
              }}
            />
            <Text
              type="password"
              label="Password"
              placeholder="Enter your password..."
              input={{
                value: password,
                name: 'password',
                onChange: onChangePassword,
              }}
            />
            <Button type="submit" disabled={loading}>Login</Button>
          </div>
        </form>
      </motion.div>
    </Modal>
  );
};

export default Login;
