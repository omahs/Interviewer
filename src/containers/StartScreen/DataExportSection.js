import React, { useState, useEffect } from 'react';
import { get, difference, isNull } from 'lodash';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@codaco/ui';
import { SessionCard } from '@codaco/ui/lib/components/Cards';
import { exportToFile, exportToServer } from '../../utils/exportProcess';
import Section from './Section';
import { actionCreators as sessionsActions } from '../../ducks/modules/session';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import useServerConnectionStatus from '../../hooks/useServerConnectionStatus';
import { Switch } from '../../components';
import NewFilterableListWrapper, { getFilteredList } from '../../components/NewFilterableListWrapper';
import { asNetworkWithSessionVariables } from '../../utils/networkFormat';
import formatDatestamp from '../../utils/formatDatestamp';
import useAPI from '../../hooks/useApi';

const oneBasedIndex = (i) => parseInt(i || 0, 10) + 1;

const DataExportSection = () => {
  const { status, error, data: sessions } = useAPI('user/sessions');
  const [filterTerm, setFilterTerm] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);

  const pairedServer = useSelector((state) => state.pairedServer);
  const pairedServerConnection = useServerConnectionStatus(pairedServer);
  const protocols = useSelector((state) => state.protocols);

  const dispatch = useDispatch();
  const deleteSession = (id) => dispatch(sessionsActions.removeSession(id));
  const openDialog = (dialog) => dispatch(dialogActions.openDialog(dialog));

  const handleFilterChange = (term) => setFilterTerm(term);

  const handleDeleteSessions = () => {
    openDialog({
      type: 'Warning',
      title: `Delete ${selectedSessions.length} Interview Session${selectedSessions.length > 1 ? 's' : ''}?`,
      confirmLabel: 'Permanently Delete',
      onConfirm: () => {
        selectedSessions.map((session) => deleteSession(session));
        setSelectedSessions([]);
      },
      message: (
        <p>
          This action will delete the selected interview data and cannot be undone.
          Are you sure you want to continue?
        </p>
      ),
    });
  };

  const handleSessionCardClick = (sessionUUID) => {
    if (selectedSessions.includes(sessionUUID)) {
      setSelectedSessions([
        ...selectedSessions.filter((session) => session !== sessionUUID),
      ]);

      return;
    }

    setSelectedSessions((alreadySelected) => [
      ...alreadySelected,
      sessionUUID,
    ]);
  };

  const formattedSessions = sessions && sessions.map((session) => {
    const {
      _id,
      caseId,
      startedAt,
      updatedAt,
      finishedAt,
      exportedAt,
    } = session;

    const progress = 15;

    return {
      caseId,
      progress,
      startedAt: formatDatestamp(startedAt),
      finishedAt: formatDatestamp(finishedAt),
      updatedAt: formatDatestamp(updatedAt),
      exportedAt: formatDatestamp(exportedAt),
      key: _id,
      selected: selectedSessions.includes(_id),
      onClickHandler: () => handleSessionCardClick(_id),
    };
  });

  const [filteredSessions, setFilteredSessions] = useState(formattedSessions);

  useEffect(() => {
    const newFilteredSessions = getFilteredList(formattedSessions, filterTerm, null);

    setFilteredSessions(newFilteredSessions);
  }, [filterTerm, selectedSessions]);

  const exportSessions = (toServer = false) => {
    const exportFunction = toServer ? exportToServer : exportToFile;

    const sessionsToExport = selectedSessions
      .map((session) => {
        const sessionProtocol = protocols[sessions[session].protocolUID];

        return asNetworkWithSessionVariables(
          session,
          sessions[session],
          sessionProtocol,
        );
      });

    exportFunction(sessionsToExport);
  };

  if (sessions && sessions.length === 0) { return null; }

  // const isSelectAll = (
  //   selectedSessions.length > 0
  //   && selectedSessions.length === filteredIds.length
  //   && difference(selectedSessions, filteredIds).length === 0
  // );

  // const toggleSelectAll = () => {
  //   if (!isSelectAll) {
  //     setSelectedSessions([...filteredIds]);
  //     return;
  //   }

  //   setSelectedSessions([]);
  // };

  // const unexportedSessions = filteredSessions
  //   .reduce((acc, { exportedAt, sessionUUID }) => {
  //     if (exportedAt) { return acc; }
  //     return [...acc, sessionUUID];
  //   }, []);

  // const isUnexportedSelected = (
  //   unexportedSessions.length > 0
  //   && selectedSessions.length > 0
  //   && selectedSessions.length === unexportedSessions.length
  //   && difference(selectedSessions, unexportedSessions).length === 0
  // );

  // const toggleSelectUnexported = () => {
  //   if (!isUnexportedSelected) {
  //     setSelectedSessions(unexportedSessions);
  //     return;
  //   }

  //   setSelectedSessions([]);
  // };

  return (
    <Section className="start-screen-section data-export-section">
      <motion.main layout className="data-export-section__main">
        <motion.header layout>
          <h2>Export &amp; Manage Interview Data</h2>
        </motion.header>
        <motion.div layout className="content-area">
          Select one or more interview sessions by tapping them, and then delete or export
          using the buttons provided. Remember that you can change export options from the
          settings menu, which can be opened from the header at the top of this screen.
        </motion.div>
        <NewFilterableListWrapper
          ItemComponent={SessionCard}
          items={filteredSessions}
          propertyPath={null}
          loading={isNull(sessions) && isNull(error)}
          initialSortProperty="updatedAt"
          initialSortDirection="desc"
          onFilterChange={handleFilterChange}
          sortableProperties={[
            {
              label: 'Last Changed',
              variable: 'updatedAt',
            },
            {
              label: 'Case ID',
              variable: 'caseId',
            },
            {
              label: 'Progress',
              variable: 'progress',
            },
          ]}
        />
        <motion.div
          className="selection-status"
          layout
        >
          <div>
            <Switch
              className="header-toggle"
              label="Select un-exported"
              // on={isUnexportedSelected}
              // onChange={toggleSelectUnexported}
            />
            <Switch
              className="header-toggle"
              label="Select all"
              // on={isSelectAll}
              // onChange={toggleSelectAll}
            />
          </div>
          { selectedSessions.length > 0
            && (
            <span>
              { selectedSessions.length}
              {' '}
              selected session
              { selectedSessions.length > 1 ? ('s') : null }
              .
            </span>
            )}
        </motion.div>
      </motion.main>
      <motion.footer layout className="data-export-section__footer">
        <Button color="neon-coral--dark" onClick={handleDeleteSessions} disabled={selectedSessions.length === 0}>Delete Selected</Button>
        <div className="action-buttons">
          { pairedServerConnection === 'ok' && (<Button onClick={() => exportSessions(true)} color="mustard" disabled={pairedServerConnection !== 'ok' || selectedSessions.length === 0}>Export Selected To Server</Button>)}
          <Button color="platinum" onClick={() => exportSessions(false)} disabled={selectedSessions.length === 0}>Export Selected To File</Button>
        </div>
      </motion.footer>
    </Section>
  );
};

export default DataExportSection;
