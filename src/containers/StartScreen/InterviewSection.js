import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { isNull } from 'lodash';
import { Spinner } from '@codaco/ui';
import { SessionCard } from '@codaco/ui/lib/components/Cards';
import Section from './Section';
import { ProtocolCard } from '../../components/Cards';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import { actionCreators as uiActions } from '../../ducks/modules/ui';
import NewSessionOverlay from './NewSessionOverlay';
import StackButton from '../../components/StackButton';
import ResumeSessionPicker from './ResumeSessionPicker';
import StartInterviewPicker from './StartInterviewPicker';
import useAPI from '../../hooks/useApi';

const InterviewSection = () => {
  // const protocols = useSelector((state) => state.protocols);

  const { data: protocols } = useAPI('protocols');
  const { data: sessions } = useAPI('user/sessions');

  const dispatch = useDispatch();
  const addSession = (caseId, protocol) => dispatch(sessionActions.addSession(caseId, protocol));
  const toggleUIOverlay = (overlay) => dispatch(uiActions.toggle(overlay));

  const showResumeSessionPicker = useSelector((state) => state.ui.showResumeSessionPicker);
  const showStartInterviewPicker = useSelector((state) => state.ui.showStartInterviewPicker);

  const [showNewSessionOverlay, setShowNewSessionOverlay] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState(null);

  const handleCloseOverlay = () => {
    setShowNewSessionOverlay(false);
    setSelectedProtocol(null);
  };

  const handleCreateSession = (caseId) => {
    addSession(caseId, selectedProtocol);
    handleCloseOverlay();
  };

  const protocolCardClickHandler = (protocolUID) => {
    setShowNewSessionOverlay(true);
    setSelectedProtocol(protocolUID);
  };

  return (
    <Section className="start-screen-section interview-section">
      { isNull(protocols) && (
        <Spinner />
      )}
      <AnimatePresence>
        {
          !isNull(protocols) && protocols.length > 0 && (
            <motion.div key="start-new" layout>
              <main className="interview-section__start-new">
                <div className="content-area">
                  <div className="content-area__last-used">
                    <header>
                      <h2>Start a New Interview</h2>
                    </header>
                    <ProtocolCard
                      onClickHandler={
                        () => protocolCardClickHandler(protocols[0].protocolUID)
                      }
                      attributes={{
                        schemaVersion: protocols[0].schemaVersion,
                        lastModified: protocols[0].lastModified,
                        installationDate: protocols[0].installationDate,
                        name: protocols[0].name,
                        description: protocols[0].description,
                      }}
                    />
                  </div>
                  <div className="content-area__other">
                    <StackButton
                      label="Select protocol"
                      cardColor="var(--color-platinum)"
                      insetColor="var(--color-slate-blue--dark)"
                      clickHandler={() => toggleUIOverlay('showStartInterviewPicker')}
                    >
                      <h4>
                        {
                          (Object.keys(protocols).length - 1) > 1 ? `+${Object.keys(protocols).length - 1} Other Protocols` : `+${Object.keys(protocols).length - 1} Other Protocol`
                        }
                      </h4>
                    </StackButton>
                  </div>
                </div>
              </main>
              <StartInterviewPicker
                show={showStartInterviewPicker}
                onClose={() => toggleUIOverlay('showStartInterviewPicker')}
              />
              <NewSessionOverlay
                handleSubmit={handleCreateSession}
                onClose={handleCloseOverlay}
                show={showNewSessionOverlay}
              />
            </motion.div>
          )
        }
        { !isNull(sessions) && Object.keys(sessions).length > 0 && (
          <motion.div key="resume-section" layout>
            <main className="interview-section__resume-section">
              <div className="content-area">
                <div className="content-area__last-session">
                  <header>
                    <h2>Resume Last Interview</h2>
                  </header>
                  <SessionCard
                    {...sessions[0]}
                  />
                </div>
                { Object.keys(sessions).length > 1 && (
                  <div className="content-area__other">
                    <StackButton
                      label="Select interview"
                      cardColor="var(--color-platinum)"
                      insetColor="var(--color-platinum--dark)"
                      clickHandler={() => toggleUIOverlay('showResumeSessionPicker')}
                    >
                      <h4>
                        {
                          (Object.keys(sessions).length - 1) > 1 ? `+${Object.keys(sessions).length - 1} Other Interviews` : `+${Object.keys(sessions).length - 1} Other Interview`
                        }
                      </h4>
                    </StackButton>
                  </div>
                )}
              </div>
            </main>
            <ResumeSessionPicker
              show={showResumeSessionPicker}
              onClose={() => toggleUIOverlay('showResumeSessionPicker')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
};

export default InterviewSection;
