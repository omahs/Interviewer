import React, { useState, useEffect } from 'react';
import { isNull } from 'lodash';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Button } from '@codaco/ui';
import { SessionCard } from '@codaco/ui/lib/components/Cards';
import Section from './Section';
import { actionCreators as sessionsActions } from '../../ducks/modules/session';
import { actionCreators as dialogActions } from '../../ducks/modules/dialogs';
import { Switch } from '../../components';
import NewFilterableListWrapper, { getFilteredList } from '../../components/NewFilterableListWrapper';
import { asNetworkWithSessionVariables } from '../../utils/networkFormat';
import formatDatestamp from '../../utils/formatDatestamp';
import useAPI from '../../hooks/useApi';

const DataExportSection = () => {
  const { data: sessions } = useAPI('user/sessions');
  const [filterTerm, setFilterTerm] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);

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
    // eslint-disable-next-line no-console
    const exportFunction = toServer ? () => console.log('export to server') : () => console.log('export to file');

    const sessionsToExport = selectedSessions
      .map((session) => asNetworkWithSessionVariables(
        session,
        sessions[session],
      ));

    exportFunction(sessionsToExport);
  };

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
          loading={isNull(sessions)}
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
          <Button color="platinum" onClick={() => exportSessions(false)} disabled={selectedSessions.length === 0}>Export Selected To File</Button>
        </div>
      </motion.footer>
    </Section>
  );
};

export default DataExportSection;
