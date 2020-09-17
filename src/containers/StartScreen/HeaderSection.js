import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@codaco/ui';
import { Section } from '.';
import NCLogo from '../../images/NC-Round.svg';
import { actionCreators as deviceSettingsActions } from '../../ducks/modules/deviceSettings';
import { importProtocolFromURI } from '../../utils/protocol/importProtocol';
import { SettingsMenuButton } from '../../components/SettingsMenu';
import { openExternalLink } from '../../components/ExternalLink';
import Switch from './Switch';
import getVersion from '../../utils/getVersion';

const HeaderSection = () => {
  const [appVersion, setAppVersion] = useState('0.0.0');
  const showGettingStarted = useSelector(state => state.deviceSettings.showGettingStarted);
  const dispatch = useDispatch();
  const toggleShowGettingStarted = () => dispatch(deviceSettingsActions.toggleSetting('showGettingStarted'));

  getVersion().then(version => setAppVersion(version));

  const start = {
    visible: {
      height: '100%',
      opacity: 1,
      transition: {
        delay: showGettingStarted ? 0 : 1,
        type: 'spring',
      },
    },
    hidden: {
      height: 0,
      opacity: 0,
    },
  };

  return (
    <Section className="start-screen-section start-screen-header">
      <motion.header layout className="start-screen-header__top">
        <SettingsMenuButton />
        <Switch
          className="header-toggle"
          label="Show 'getting started'"
          on={showGettingStarted}
          onChange={toggleShowGettingStarted}
        />
      </motion.header>
      <motion.div layout className="start-screen-header__wrapper">
        <div className="header-mark">
          <h1>Network Canvas</h1>
          <h4>Simplifying complex network data collection.</h4>
        </div>
        <div className="header-brand">
          <img src={NCLogo} className="header-logo" alt="Network Canvas" />
        </div>
        <div className="version-string">{appVersion}</div>
      </motion.div>
      <motion.section className="welcome-section">
        <AnimatePresence>
          { showGettingStarted && (
            <motion.div
              exit="hidden"
              variants={start}
              layout
            >
              <main className="welcome-section__main">
                <header>
                  <h2>Getting Started</h2>
                </header>
                <div className="welcome-description">
                  <p>
                    If this is your first time using Network Canvas, please consider taking
                    a moment to watch our overview video. It will introduce you to the key
                    concepts of the Network Canvas project.
                  </p>
                  <p>
                    For further detailed information, tutorials, videos, and information about
                    collaboration, please visit our documentation website.
                  </p>
                  <p>
                    To get started right away, install one or more interview protocols
                    onto this device. For convenience, we have created a sample interview
                    protocol on the theme of &quot;public health&quot; research.
                  </p>
                </div>
                <div className="welcome-actions">
                  <Button
                    color="primary"
                    onClick={() => openExternalLink('https://www.youtube.com/watch?v=XzfE6j-LnII')}
                  >
                    Watch overview video
                  </Button>
                  <Button
                    color="sea-serpent"
                    onClick={() => openExternalLink('https://documentation.networkcanvas.com')}
                  >
                    Visit documentation website
                  </Button>
                  <Button
                    color="mustard"
                    onClick={() => importProtocolFromURI('https://documentation.networkcanvas.com/protocols/Public%20Health%20Demo%20Protocol.netcanvas')}
                  >
                    Install sample protocol
                  </Button>
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </Section>
  );
};

HeaderSection.propTypes = {
};

HeaderSection.defaultProps = {
};

export default HeaderSection;

export { HeaderSection as UnconnectedHeaderSection };
